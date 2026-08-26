import { triageSymptoms } from '../services/geminiService.js';
export async function assessTriage(req, res) { const { text, language = 'English' } = req.body || {}; if (typeof text !== 'string' || !text.trim())
    return res.status(400).json({ success: false, message: 'A symptom description is required.' }); try {
    res.json({ success: true, data: await triageSymptoms(text.slice(0, 4000), language) });
}
catch {
    res.status(500).json({ success: false, message: 'Triage is temporarily unavailable.' });
} }
