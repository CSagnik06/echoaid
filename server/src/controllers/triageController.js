import { triageSymptoms } from '../services/geminiService.js';

export async function assessTriage(req, res) {
  // Accept both `symptoms` (new client shape) and `text` (legacy shape)
  const { symptoms, text, language = 'English' } = req.body || {};
  const input = (symptoms || text || '').trim();
  if (!input) {
    return res.status(400).json({ success: false, message: 'A symptom description is required.' });
  }
  try {
    res.json({ success: true, data: await triageSymptoms(input.slice(0, 4000), language) });
  } catch {
    res.status(500).json({ success: false, message: 'Triage is temporarily unavailable.' });
  }
}
