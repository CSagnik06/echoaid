import { transcribe } from '../services/groqService.js';
import { conductVoiceConsultation } from '../services/geminiService.js';

export async function voiceTranscribe(req, res) { 
    try {
        const language = String(req.body.language || 'English');
        const data = await transcribe(req.file, language);
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, message: 'Unable to transcribe audio' });
    } 
}

export async function voiceConsult(req, res) {
    try {
        const history = req.body.history || [];
        const language = String(req.body.language || 'English');
        const data = await conductVoiceConsultation(history, language);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Voice consultation failed', error: err.message });
    }
}
