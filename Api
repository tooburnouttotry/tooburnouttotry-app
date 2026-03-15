// ═══════════════════════════════════════════════════════════
//  api/chat.js — Vercel Serverless Function
//
//  Runs on Vercel's servers — NOT in the user's browser.
//  Your Gemini API key is stored as an environment variable.
//  Buyers never see it. The app just works for them.
//
//  Flow:
//  User types → index.html → POST /api/chat → Gemini → response
// ═══════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a calm, grounded support companion for mothers with ADHD who are experiencing burnout. You are NOT a therapist or doctor. You are trauma-aware, warm, and direct — never preachy, never hustle-culture, never shaming.

RESPONSE FORMAT — return ONLY a valid JSON object with exactly these four keys:
{
  "validation": "1-2 sentences. Grounded acknowledgment. Calm, not dramatic.",
  "lens": "2-3 sentences. Explain what might be happening through an ADHD + burnout lens. Simple language only. No jargon.",
  "guidance": ["Suggestion 1", "Suggestion 2", "One zero-effort option — like sitting still or doing nothing at all"],
  "permission": "1-2 sentences. Give permission to rest, go slowly, or do nothing."
}

RULES:
- Maximum 3 guidance items. The LAST item must always require almost zero energy.
- No multi-step plans. No productivity frameworks. No toxic positivity. No hustle language.
- No spiritual or religious framing. No parenting judgments. No medical advice.
- Keep every section SHORT. Short sentences. Burned-out moms cannot read walls of text.
- Write as if quietly talking to a tired friend. Never performative wellness.
- Never use the word "journey."

CRISIS — if user expresses extreme distress (hating life, wanting to disappear, not wanting to be here, failing as a mom, hurting themselves):
- Use the same four JSON keys but add a fifth: "crisis": true
- Be extra warm and slow in your validation
- In the permission field, gently note that real human support exists

Return ONLY the raw JSON. No markdown. No code fences. No extra text.`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Your Gemini API key — set this in Vercel:
  // Dashboard → Project → Settings → Environment Variables
  // Name: GEMINI_API_KEY   Value: your AIzaSy... key
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY environment variable');
    return res.status(500).json({ error: 'Server not configured. Please add your Gemini API key in Vercel.' });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: [
            { role: 'user', parts: [{ text: message.trim() }] }
          ],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 700,
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      console.error('Gemini error:', geminiRes.status, errData);
      if (geminiRes.status === 429) return res.status(429).json({ error: 'Daily limit reached. Please try again tomorrow.' });
      return res.status(500).json({ error: 'AI service error. Please try again.' });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText) return res.status(500).json({ error: 'Empty response from AI. Please try again.' });

    const cleaned = rawText.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Handler error:', err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Unexpected format. Please try again.' });
    }
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
