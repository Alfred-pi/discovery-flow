import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { z } from 'zod';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const CODES_FILE = path.join(__dirname, 'codes.json');

// ===== SECURITY: Input Sanitization =====
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')           // Strip HTML tags
    .replace(/javascript:/gi, '')    // Strip JS protocol
    .replace(/on\w+=/gi, '')         // Strip event handlers
    .replace(/\{\{.*?\}\}/g, '')     // Strip template injections
    .replace(/\$\{.*?\}/g, '')       // Strip template literals
    .trim()
    .slice(0, 2000);                 // Max length
}

function sanitizeDeep(obj) {
  if (typeof obj === 'string') return sanitize(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeDeep);
  if (typeof obj === 'object' && obj !== null) {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      clean[sanitize(key)] = sanitizeDeep(value);
    }
    return clean;
  }
  return obj;
}

// ===== TELEGRAM HELPER =====
async function sendTelegram(text) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    });
    console.log(`[TELEGRAM] Message sent`);
  } catch (e) {
    console.warn(`[TELEGRAM] Error: ${e.message}`);
  }
}

async function sendTelegramFile(content, filename, caption) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    const { Blob } = await import('buffer');
    const form = new FormData();
    form.append('chat_id', CHAT_ID);
    form.append('document', new Blob([content], { type: 'text/markdown' }), filename);
    form.append('caption', caption);
    form.append('parse_mode', 'Markdown');
    
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`[TELEGRAM] File sent: ${filename}`);
    } else {
      console.warn(`[TELEGRAM] File failed: ${data.description}`);
    }
  } catch (e) {
    console.warn(`[TELEGRAM] File error: ${e.message}`);
  }
}

// ===== CODES MANAGEMENT =====
async function loadCodes() {
  try {
    const data = await fs.readFile(CODES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveCodes(codes) {
  await fs.writeFile(CODES_FILE, JSON.stringify(codes, null, 2), { mode: 0o600 });
}

function generateCode() {
  // Format: WORD + 2 digits (e.g., NOVA42, SPARK17, OCEAN83)
  const words = ['ALPHA', 'BLAZE', 'CORAL', 'DELTA', 'EAGLE', 'FLUX', 'GRID', 'HIVE', 
                 'IRON', 'JADE', 'KITE', 'LINK', 'MARS', 'NOVA', 'ONYX', 'PULSE', 
                 'QUARTZ', 'RIDGE', 'SPARK', 'TIDE', 'ULTRA', 'VIBE', 'WAVE', 'XENON',
                 'YARN', 'ZERO', 'APEX', 'BOLT', 'CORE', 'DAWN', 'ECHO', 'FUSE'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 10-99
  return `${word}${num}`;
}

// ===== MIDDLEWARE =====
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

// Rate limiting
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // 10 attempts per 15min
  message: { error: 'Too many attempts. Please try again later.' },
});

// ===== VALIDATION =====
const SubmissionSchema = z.object({
  token: z.string().min(1),
  answers: z.record(z.any()),
  timestamp: z.string(),
  language: z.enum(['fr', 'en']).optional(),
  code: z.string().optional(),
});

const CodeVerifySchema = z.object({
  code: z.string().min(1).max(20),
});

// ===== FORMAT =====
function formatSubmission(data, codeInfo) {
  const { answers, timestamp, language } = data;
  let md = `# Discovery Flow Submission\n\n`;
  md += `**Date**: ${new Date(timestamp).toLocaleString('fr-CH')}\n`;
  md += `**Language**: ${language || 'fr'}\n`;
  if (codeInfo) {
    md += `**Client**: ${sanitize(codeInfo.client)}\n`;
    md += `**Code**: ${sanitize(codeInfo.code)}\n`;
  }
  md += `\n---\n\n`;

  for (const [key, value] of Object.entries(answers)) {
    md += `## ${sanitize(key)}\n\n`;
    
    if (typeof value === 'object' && value !== null) {
      if (value.value && Array.isArray(value.value)) {
        md += `**Selections**: ${value.value.map(sanitize).join(', ')}\n\n`;
      }
      if (value.details) {
        md += `**Details**: ${sanitize(value.details)}\n\n`;
      }
    } else if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // Sanitize parsed JSON values
        const cleanParsed = sanitizeDeep(parsed);
        md += '```json\n' + JSON.stringify(cleanParsed, null, 2) + '\n```\n\n';
      } catch {
        md += `${sanitize(value)}\n\n`;
      }
    }
  }

  return md;
}

// ===== ROUTES =====

// Verify access code + notify on start
app.post('/api/verify-code', codeLimiter, async (req, res) => {
  try {
    const { code } = CodeVerifySchema.parse(req.body);
    const cleanCode = sanitize(code).toUpperCase();
    const codes = await loadCodes();
    
    const codeEntry = codes[cleanCode];
    
    if (!codeEntry || codeEntry.used) {
      console.warn(`[SECURITY] Invalid code attempt: "${cleanCode}" from ${req.ip}`);
      
      // Notify on suspicious repeated attempts
      await sendTelegram(
        `⚠️ *Code invalide tenté*\n\nCode: \`${cleanCode}\`\nIP: \`${req.ip}\`\n📅 ${new Date().toLocaleString('fr-CH')}`
      );
      
      return res.status(401).json({ error: 'Invalid code' });
    }
    
    // Mark as started
    codeEntry.startedAt = new Date().toISOString();
    codeEntry.ip = req.ip;
    await saveCodes(codes);
    
    // Notify: client started the form
    await sendTelegram(
      `🟢 *Questionnaire démarré !*\n\n👤 ${sanitize(codeEntry.client)}\n🔑 Code: \`${cleanCode}\`\n📅 ${new Date().toLocaleString('fr-CH')}`
    );
    
    console.log(`[ACCESS] Code ${cleanCode} used by ${codeEntry.client}`);
    
    res.json({ 
      valid: true, 
      token: JWT_SECRET, // Give them the submission token
      client: sanitize(codeEntry.client),
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    console.error(`[ERROR] verify-code: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit form
app.post('/api/submit', submitLimiter, async (req, res) => {
  try {
    const validated = SubmissionSchema.parse(req.body);
    
    // Sanitize ALL answers
    validated.answers = sanitizeDeep(validated.answers);

    if (validated.token !== JWT_SECRET) {
      console.warn(`[SECURITY] Invalid token from ${req.ip}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Look up code info
    let codeInfo = null;
    if (validated.code) {
      const codes = await loadCodes();
      const entry = codes[validated.code.toUpperCase()];
      if (entry) {
        codeInfo = { client: entry.client, code: validated.code.toUpperCase() };
        // Mark as completed
        entry.completedAt = new Date().toISOString();
        entry.used = true;
        await saveCodes(codes);
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const clientSlug = codeInfo ? `-${codeInfo.client.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}` : '';
    const filename = `${timestamp}${clientSlug}.md`;
    const submissionsDir = path.join(__dirname, '../submissions');
    const filepath = path.join(submissionsDir, filename);

    await fs.mkdir(submissionsDir, { recursive: true });

    const content = formatSubmission(validated, codeInfo);
    await fs.writeFile(filepath, content, { mode: 0o600 });

    console.log(`[SUCCESS] Submission saved: ${filename}`);

    // Telegram: send file
    try {
      const contactData = validated.answers.contact 
        ? (typeof validated.answers.contact === 'string' ? JSON.parse(validated.answers.contact) : validated.answers.contact)
        : {};
      
      const caption = `📋 *Soumission reçue !*\n\n👤 ${sanitize(contactData.name || codeInfo?.client || 'Inconnu')}\n📧 ${sanitize(contactData.email || 'pas d\'email')}\n🔑 Code: \`${codeInfo?.code || 'N/A'}\`\n🌐 ${validated.language || 'fr'}\n📅 ${new Date().toLocaleString('fr-CH')}`;
      
      await sendTelegramFile(content, filename, caption);
    } catch (tgError) {
      console.warn(`[TELEGRAM] Error: ${tgError.message}`);
    }

    res.json({ success: true, message: 'Submission received', filename });

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

// ===== ADMIN ROUTES =====

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/api/admin/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

const adminAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (auth.split(' ')[1] !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
};

// Create a new client code
app.post('/api/admin/codes', adminAuth, async (req, res) => {
  try {
    const { client } = req.body;
    if (!client || typeof client !== 'string') {
      return res.status(400).json({ error: 'Client name required' });
    }
    
    const codes = await loadCodes();
    
    // Generate unique code
    let code;
    do {
      code = generateCode();
    } while (codes[code]);
    
    codes[code] = {
      client: sanitize(client),
      createdAt: new Date().toISOString(),
      used: false,
      startedAt: null,
      completedAt: null,
    };
    
    await saveCodes(codes);
    
    console.log(`[ADMIN] Code created: ${code} for ${client}`);
    
    res.json({ code, client: sanitize(client) });
  } catch (error) {
    console.error(`[ERROR] create code: ${error.message}`);
    res.status(500).json({ error: 'Failed to create code' });
  }
});

// List all codes
app.get('/api/admin/codes', adminAuth, async (req, res) => {
  try {
    const codes = await loadCodes();
    res.json({ codes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list codes' });
  }
});

// Delete a code
app.delete('/api/admin/codes/:code', adminAuth, async (req, res) => {
  try {
    const codes = await loadCodes();
    const code = req.params.code.toUpperCase();
    if (!codes[code]) {
      return res.status(404).json({ error: 'Code not found' });
    }
    delete codes[code];
    await saveCodes(codes);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete code' });
  }
});

// List submissions
app.get('/api/admin/list', adminAuth, async (req, res) => {
  try {
    const submissionsDir = path.join(__dirname, '../submissions');
    await fs.mkdir(submissionsDir, { recursive: true });
    const files = await fs.readdir(submissionsDir);
    
    const submissions = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async (filename) => {
          const filepath = path.join(submissionsDir, filename);
          const content = await fs.readFile(filepath, 'utf-8');
          
          const dateMatch = content.match(/\*\*Date\*\*:\s*(.+)/);
          const langMatch = content.match(/\*\*Language\*\*:\s*(.+)/);
          const clientMatch = content.match(/\*\*Client\*\*:\s*(.+)/);
          const nameMatch = content.match(/"name":\s*"([^"]+)"/);
          const emailMatch = content.match(/"email":\s*"([^"]+)"/);
          
          return {
            filename,
            date: dateMatch ? dateMatch[1].trim() : filename,
            language: langMatch ? langMatch[1].trim() : 'fr',
            client: clientMatch ? clientMatch[1].trim() : (nameMatch ? nameMatch[1] : 'Unknown'),
            email: emailMatch ? emailMatch[1] : 'no-email',
          };
        })
    );
    
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

// Start HTTPS server (required for GitHub Pages mixed content)
import https from 'https';

const sslOptions = {
  key: await fs.readFile(path.join(__dirname, 'key.pem')),
  cert: await fs.readFile(path.join(__dirname, 'cert.pem')),
};

https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`[BACKEND] Discovery Flow API running on HTTPS port ${PORT}`);
  console.log(`[SECURITY] CORS allowed origin: ${process.env.ALLOWED_ORIGIN}`);
  console.log(`[SECURITY] Rate limit: 5 submissions/hour, 10 code attempts/15min`);
});
