import express from 'express';
import cors from 'cors';
import multer from 'multer';
import 'dotenv/config';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = 4071;

app.use(cors({ origin: 'http://localhost:4070' }));
app.use(express.json());

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
      return;
    }

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/webm' }),
      'audio.webm'
    );
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', response.status, errorText);
      res.status(response.status).json({ error: 'Transcription failed' });
      return;
    }

    const data = (await response.json()) as { text: string };
    res.json({ text: data.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/submit', (req, res) => {
  console.log('Brief received:', JSON.stringify(req.body, null, 2));

  const webhookUrl = process.env.WEBHOOK_URL;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    }).catch((err) => console.error('Webhook error:', err));
  }

  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Discovery Flow API running on http://localhost:${PORT}`);
});
