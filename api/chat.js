export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key missing' });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a calm support companion for ADHD moms with burnout. Respond ONLY in this exact JSON format with no extra text:
{"validation":"1-2 warm sentences acknowledging their feeling","lens":"2-3 sentences explaining through ADHD burnout lens","guidance":["suggestion 1","suggestion 2","zero effort option"],"permission":"1-2 sentences giving permission to rest"}

User message: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 700
          }
        })
      }
    );

    if (!geminiRes.ok) {
      if (geminiRes.status === 429) return res.status(429).json({ error: 'Daily limit reached. Please try again tomorrow.' });
      return res.status(500).json({ error: 'AI service error. Please try again.' });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) return res.status(500).json({ error: 'Empty response. Try again.' });

    const parsed = JSON.parse(rawText.replace(/```json|```/gi, '').trim());
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
      }
