import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { z } from 'zod';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Security middleware (CSP adjusted for inline scripts in admin)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'https://alfred-pi.github.io',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// Rate limiting: 5 submissions per hour per IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schema
const SubmissionSchema = z.object({
  token: z.string().min(1),
  answers: z.record(z.any()),
  timestamp: z.string(),
  language: z.enum(['fr', 'en']).optional(),
});

// Sanitize filename (prevent path traversal)
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, '');
}

// Format submission as markdown
function formatSubmission(data) {
  const { answers, timestamp, language } = data;
  let md = `# Discovery Flow Submission\n\n`;
  md += `**Date**: ${new Date(timestamp).toLocaleString('fr-CH')}\n`;
  md += `**Language**: ${language || 'fr'}\n\n`;
  md += `---\n\n`;

  for (const [key, value] of Object.entries(answers)) {
    md += `## ${key}\n\n`;
    
    if (typeof value === 'object' && value !== null) {
      if (value.value && Array.isArray(value.value)) {
        md += `**Selections**: ${value.value.join(', ')}\n\n`;
      }
      if (value.details) {
        md += `**Details**: ${value.details}\n\n`;
      }
    } else if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        md += '```json\n' + JSON.stringify(parsed, null, 2) + '\n```\n\n';
      } catch {
        md += `${value}\n\n`;
      }
    }
  }

  return md;
}

// Submission endpoint
app.post('/api/submit', limiter, async (req, res) => {
  try {
    // Validate request
    const validated = SubmissionSchema.parse(req.body);

    // Verify token (simple check, you can enhance with JWT verify)
    if (validated.token !== JWT_SECRET) {
      console.warn(`[SECURITY] Invalid token from ${req.ip}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${timestamp}.md`;
    const submissionsDir = path.join(__dirname, '../submissions');
    const filepath = path.join(submissionsDir, filename);

    // Ensure submissions directory exists
    await fs.mkdir(submissionsDir, { recursive: true });

    // Format and write submission
    const content = formatSubmission(validated);
    await fs.writeFile(filepath, content, { mode: 0o600 });

    console.log(`[SUCCESS] Submission saved: ${filename}`);

    // Send Telegram notification
    const contactData = validated.answers.contact 
      ? JSON.parse(validated.answers.contact) 
      : {};
    const telegramMsg = `🎉 **New Discovery Flow Submission**\n\nFile: \`${filename}\`\nContact: ${contactData.name || 'Unknown'} (${contactData.email || 'no-email'})\nLanguage: ${validated.language || 'fr'}\n\nReady for you at: \`~/Repos/workspace/perso/discovery-flow/submissions/${filename}\``;
    
    console.log(`[NOTIFY] ${telegramMsg}`);

    res.json({ 
      success: true, 
      message: 'Submission received',
      filename 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn(`[VALIDATION] ${error.message}`);
      return res.status(400).json({ error: 'Invalid submission data' });
    }
    console.error(`[ERROR] ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Admin auth
app.post('/api/admin/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_PASSWORD }); // Simple token = password
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Admin middleware
const adminAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.split(' ')[1];
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
};

// List submissions
app.get('/api/admin/list', adminAuth, async (req, res) => {
  try {
    const submissionsDir = path.join(__dirname, '../submissions');
    const files = await fs.readdir(submissionsDir);
    
    const submissions = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async (filename) => {
          const filepath = path.join(submissionsDir, filename);
          const content = await fs.readFile(filepath, 'utf-8');
          
          // Parse basic info
          const dateMatch = content.match(/\*\*Date\*\*:\s*(.+)/);
          const langMatch = content.match(/\*\*Language\*\*:\s*(.+)/);
          const nameMatch = content.match(/"name":\s*"([^"]+)"/);
          const emailMatch = content.match(/"email":\s*"([^"]+)"/);
          
          return {
            filename,
            date: dateMatch ? dateMatch[1].trim() : filename,
            language: langMatch ? langMatch[1].trim() : 'fr',
            client: nameMatch ? nameMatch[1] : 'Unknown',
            email: emailMatch ? emailMatch[1] : 'no-email',
          };
        })
    );
    
    // Sort by date desc
    submissions.sort((a, b) => b.filename.localeCompare(a.filename));
    
    res.json({ submissions });
  } catch (error) {
    console.error('[ERROR] List submissions:', error.message);
    res.status(500).json({ error: 'Failed to list submissions' });
  }
});

// Read submission
app.get('/api/admin/read/:filename', adminAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Sanitize filename (prevent path traversal)
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filepath = path.join(__dirname, '../submissions', filename);
    const content = await fs.readFile(filepath, 'utf-8');
    
    res.json({ content });
  } catch (error) {
    console.error('[ERROR] Read submission:', error.message);
    res.status(500).json({ error: 'Failed to read submission' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BACKEND] Discovery Flow API running on port ${PORT}`);
  console.log(`[SECURITY] CORS allowed origin: ${process.env.ALLOWED_ORIGIN}`);
  console.log(`[SECURITY] Rate limit: 5 submissions/hour per IP`);
});
