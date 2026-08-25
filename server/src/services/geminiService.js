import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

function fallback(text, language) { 
    const t = text.toLowerCase();
    const red = /chest pain|breath|unconscious|stroke|severe bleeding|suicide|seizure|सीने|শ্বাস|বুকে/.test(t);
    const yellow = /fever|dizz|vomit|pain|headache|burn|headache|জ্বর|ব্যথা|बुखार|दर्द/.test(t);
    const u = red ? 'RED' : yellow ? 'YELLOW' : 'GREEN';
    const lang = (language === 'Hindi' || language === 'Bengali' ? language : 'English'); 
    return { 
        alertLevel: u, 
        urgencyTitle: red ? 'EMERGENCY ALERT' : yellow ? 'MODERATE ATTENTION' : 'MILD / SELF-CARE',
        detectedLanguage: lang, 
        summary: red ? 'Symptoms may need urgent emergency assessment.' : yellow ? 'Your symptoms should be assessed by a clinician soon.' : 'This sounds low risk based on the information provided.', 
        immediateActions: red ? ['Call 112 or local emergency services now.', 'Do not drive yourself; ask someone to stay with you.', 'If symptoms worsen, seek emergency care immediately.'] : yellow ? ['Rest in a safe place and stay hydrated if appropriate.', 'Arrange a same-day clinical assessment.', 'Seek emergency care for worsening symptoms.'] : ['Monitor symptoms and rest.', 'Book routine medical advice if symptoms persist.', 'Seek urgent help if new severe symptoms appear.'], 
        recommendedCare: red ? 'Immediate Hospital Emergency' : yellow ? 'Local Clinic / General Physician' : 'Home Care', 
        voiceResponse: red ? 'This could be serious. Please call emergency services immediately.' : yellow ? 'Please arrange medical care today, especially if symptoms worsen.' : 'Please monitor your symptoms. This is not a medical diagnosis.', 
        source: 'fallback' 
    }; 
}

export async function triage(text, language) { 
    if (env.geminiKey) {
        try {
            const ai = new GoogleGenerativeAI(env.geminiKey);
            const prompt = `Return ONLY a raw JSON object (no markdown, no backticks). Structure:
{
  "alertLevel": "GREEN" | "YELLOW" | "RED",
  "urgencyTitle": "MILD / SELF-CARE" | "MODERATE ATTENTION" | "EMERGENCY ALERT",
  "detectedLanguage": "${language}",
  "summary": "Clear, empathetic clinical analysis",
  "immediateActions": ["step 1", "step 2"],
  "recommendedCare": "Home Care" | "Local Clinic / General Physician" | "Immediate Hospital Emergency",
  "voiceResponse": "Natural, conversational spoken summary to be read out aloud by TTS"
}
Medical safety:
- GREEN Alert: Mild symptoms, home treatment & hydration guide.
- YELLOW Alert: Moderate symptoms, schedule clinic/doctor visit.
- RED Alert: Severe emergencies (chest pain, stroke, heavy blood loss) with direct emergency alert.
Ensure output is in the specified language: ${language}. Text: ${text}`;
            const r = await ai.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent(prompt);
            let rawText = r.response.text();
            rawText = rawText.replace(/```json|```/g, '').trim();
            const p = JSON.parse(rawText);
            return { ...p, source: 'gemini' };
        }
        catch (e) { console.error("Gemini Error:", e) }
    } 
    return fallback(text, language); 
}
