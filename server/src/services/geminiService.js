import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
function fallback(text, language) { const t = text.toLowerCase(), red = /chest pain|breath|unconscious|stroke|severe bleeding|suicide|seizure|सीने|শ্বাস|বুকে/.test(t), yellow = /fever|dizz|vomit|pain|headache|burn|headache|জ্বর|ব্যথা|बुखार|दर्द/.test(t), u = red ? 'RED' : yellow ? 'YELLOW' : 'GREEN', lang = (language === 'Hindi' || language === 'Bengali' ? language : 'English'); return { urgency_score: u, detected_language: lang, condition_summary: red ? 'Symptoms may need urgent emergency assessment.' : yellow ? 'Your symptoms should be assessed by a clinician soon.' : 'This sounds low risk based on the information provided.', immediate_actions: red ? ['Call 112 or local emergency services now.', 'Do not drive yourself; ask someone to stay with you.', 'If symptoms worsen, seek emergency care immediately.'] : yellow ? ['Rest in a safe place and stay hydrated if appropriate.', 'Arrange a same-day clinical assessment.', 'Seek emergency care for worsening symptoms.'] : ['Monitor symptoms and rest.', 'Book routine medical advice if symptoms persist.', 'Seek urgent help if new severe symptoms appear.'], suggested_facility_type: red ? 'Emergency hospital' : yellow ? 'Clinic or hospital outpatient' : 'Primary care clinic', voice_response_text: red ? 'This could be serious. Please call emergency services immediately.' : yellow ? 'Please arrange medical care today, especially if symptoms worsen.' : 'Please monitor your symptoms. This is not a medical diagnosis.', source: 'fallback' }; }
export async function triage(text, language) { if (env.geminiKey) {
    try {
        const ai = new GoogleGenerativeAI(env.geminiKey);
        const prompt = `Return only JSON with urgency_score RED/YELLOW/GREEN, detected_language English/Hindi/Bengali, condition_summary, immediate_actions string array, suggested_facility_type, voice_response_text. Medical safety: do not diagnose; conservatively escalate life-threatening symptoms; state it is not a replacement for professional care. Text: ${text}; language: ${language}`;
        const r = await ai.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent(prompt);
        const p = JSON.parse(r.response.text().replace(/```json|```/g, ''));
        return { ...p, source: 'gemini' };
    }
    catch { }
} return fallback(text, language); }
