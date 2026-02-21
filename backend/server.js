// ============================================================
// JanSeva Backend — AI Enhancement + Email Proxy
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json({ limit: '5mb' }));

// ── Gemini AI Client ────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── Nodemailer Transport ────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD  // 16-char Google App Password
    }
});

// ──────────────────────────────────────────────────────────
// POST /api/enhance
// Enhance complaint text using Gemini AI
// ──────────────────────────────────────────────────────────
app.post('/api/enhance', async (req, res) => {
    const { text, category, department, field } = req.body;

    if (!text || text.trim().length < 10) {
        return res.status(400).json({ error: 'Input text is too short to enhance.' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured in backend .env' });
    }

    const isTitle = field === 'title';
    const prompt = isTitle
        ? `You are an assistant helping citizens write formal government complaint titles.
Rewrite the following complaint title into a clear, formal, one-line title suitable for an official grievance portal.
Keep it concise (max 15 words). Do NOT use abusive language. If input is invalid or nonsensical, return exactly: ERROR_INVALID_INPUT

Title: "${text}"
Category: ${category}
Department: ${department}

Return ONLY the rewritten title, nothing else.`
        : `You are an assistant helping citizens write formal government grievance complaints.
Rewrite the following complaint description into a clear, formal, professional complaint suitable for submission to a government department.
Language should be formal English. Preserve the original meaning. Do NOT include abusive, discriminatory or inappropriate content.
If the input is clearly invalid, abusive or completely nonsensical, return exactly: ERROR_INVALID_INPUT

Original complaint: "${text}"
Category: ${category}
Department: ${department}

Return ONLY the rewritten complaint description, nothing else.`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const enhanced = result.response.text().trim();

        if (enhanced === 'ERROR_INVALID_INPUT') {
            return res.status(422).json({
                error: 'Invalid or inappropriate content detected. Please provide a clear, valid complaint description.'
            });
        }

        return res.json({ enhanced });
    } catch (err) {
        console.error('Gemini error:', err.message);
        return res.status(500).json({ error: 'AI enhancement failed: ' + err.message });
    }
});

// ──────────────────────────────────────────────────────────
// POST /api/send-email
// Send official email via Gmail SMTP (Nodemailer)
// ──────────────────────────────────────────────────────────
app.post('/api/send-email', async (req, res) => {
    const { to, subject, body, complaintId } = req.body;

    if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return res.status(500).json({ error: 'Gmail credentials not configured in backend .env' });
    }

    try {
        const info = await transporter.sendMail({
            from: `"JanSeva Grievance Cell" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            text: body,
            html: `<pre style="font-family: Arial, sans-serif; font-size:14px; white-space:pre-wrap;">${body}</pre>`
        });

        console.log(`[EMAIL] Sent complaint ${complaintId} to ${to}. MessageId: ${info.messageId}`);
        return res.json({ success: true, messageId: info.messageId });
    } catch (err) {
        console.error('Email error:', err.message);
        return res.status(500).json({ error: 'Email sending failed: ' + err.message });
    }
});

// ── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        gemini: !!process.env.GEMINI_API_KEY,
        gmail: !!process.env.GMAIL_USER,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`✅ JanSeva Backend running on http://localhost:${PORT}`);
    console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ Not set (add to .env)'}`);
    console.log(`   Gmail SMTP: ${process.env.GMAIL_USER ? '✓ Configured' : '✗ Not set (add to .env)'}`);
});
