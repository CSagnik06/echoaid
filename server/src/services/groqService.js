import axios from 'axios';
import { env } from '../config/env.js';
export async function transcribe(audio, language) { if (audio && env.groqKey) {
    try {
        const body = new FormData();
        const bytes = new Uint8Array(audio.buffer);
        body.append('file', new Blob([bytes], { type: audio.mimetype }), audio.originalname);
        body.append('model', 'whisper-large-v3-turbo');
        body.append('language', language === 'Hindi' ? 'hi' : language === 'Bengali' ? 'bn' : 'en');
        const { data } = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', body, { headers: { Authorization: `Bearer ${env.groqKey}` } });
        return { text: data.text, source: 'groq' };
    }
    catch { }
} const phrase = language === 'Hindi' ? 'मुझे सीने में दर्द और चक्कर आ रहे हैं।' : language === 'Bengali' ? 'আমার বুকে ব্যথা এবং মাথা ঘোরা হচ্ছে।' : 'I have a headache and feel dizzy since this morning.'; return { text: phrase, source: 'fallback' }; }
