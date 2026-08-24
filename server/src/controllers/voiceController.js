import { transcribe } from '../services/groqService.js';
export async function voiceTranscribe(req, res) { try {
    const language = String(req.body.language || 'English');
    const data = await transcribe(req.file, language);
    res.json({ success: true, data });
}
catch {
    res.status(500).json({ success: false, message: 'Unable to transcribe audio' });
} }
