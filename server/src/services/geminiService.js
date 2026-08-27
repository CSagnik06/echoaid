import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { extractMedicineStrength, knownMedicineAlias } from './medicineAliases.js';

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
            const r = await ai.getGenerativeModel({ model: 'gemini-3.6-flash' }).generateContent(prompt);
            let rawText = r.response.text();
            rawText = rawText.replace(/```json|```/g, '').trim();
            const p = JSON.parse(rawText);
            return { ...p, source: 'gemini' };
        }
        catch (e) { console.error("Gemini Error:", e) }
    } 
    return fallback(text, language); 
}

export async function askMedicine(question) {
    if (!env.geminiKey) {
        const error = new Error('MEDICINE_AI_NOT_CONFIGURED');
        error.code = 'MEDICINE_AI_NOT_CONFIGURED';
        throw error;
    }

    const ai = new GoogleGenerativeAI(env.geminiKey);
    const instruction = `You are the medicine information assistant inside the Sanjeevani healthcare application.
Answer only general informational questions about medicines in simple language.
Include only information relevant to the question, such as a medicine's general purpose, common uses, common side effects, medicine class, precautions, or general warnings when confidently known.
Do not diagnose, prescribe, recommend starting or stopping a medicine, change a prescribed dose, calculate a personalized dose, recommend a replacement, or claim a medicine is definitely safe for a specific person.
If asked to make a personal medication decision, advise speaking with the prescribing doctor or a pharmacist.
Do not invent medicine information. If reliable information cannot be determined, clearly say so.
Keep normal answers concise, practical, and approximately 50 to 200 words unless the user explicitly requests detail.
Do not add a disclaimer; the interface displays one separately.

User question: ${question}`;

    try {
        const response = await ai.getGenerativeModel({ model: 'gemini-3.6-flash' }).generateContent(instruction);
        const answer = response.response.text().trim();
        if (!answer) throw new Error('EMPTY_MEDICINE_AI_RESPONSE');
        return answer;
    } catch (error) {
        if (error.code === 'MEDICINE_AI_NOT_CONFIGURED') throw error;
        const unavailable = new Error('MEDICINE_AI_UNAVAILABLE');
        unavailable.code = 'MEDICINE_AI_UNAVAILABLE';
        throw unavailable;
    }
}

export async function normalizeMedicineName(value) {
    const originalQuery = String(value || '').trim();
    const known = knownMedicineAlias(originalQuery);
    if (known) return { originalQuery, possibleBrand: known.possibleBrand, genericName: known.genericName, alternateGenericName: known.alternateGenericName, strength: extractMedicineStrength(originalQuery), confidence: known.confidence };
    if (!env.geminiKey) return null;

    const prompt = `Identify only the likely medicine brand/generic name in the user's query. Do not provide uses, doses, side effects, precautions, contraindications, interactions, or treatment advice. Return ONLY valid raw JSON with this exact shape and no markdown:
{"originalQuery":"","possibleBrand":"","genericName":"","alternateGenericName":"","strength":"","confidence":"high|medium|low"}
Use an empty string for any field that cannot be determined reliably. If the query is fake or unknown, leave genericName empty. User query: ${JSON.stringify(originalQuery)}`;
    try {
        const ai = new GoogleGenerativeAI(env.geminiKey);
        const response = await ai.getGenerativeModel({ model: 'gemini-3.6-flash', generationConfig: { temperature: 0 } }).generateContent(prompt);
        const raw = response.response.text().replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(raw);
        const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low';
        const genericName = String(parsed.genericName || '').trim().slice(0, 100);
        if (!genericName || confidence === 'low') return null;
        return { originalQuery, possibleBrand: String(parsed.possibleBrand || originalQuery).trim().slice(0, 100), genericName, alternateGenericName: String(parsed.alternateGenericName || '').trim().slice(0, 100), strength: String(parsed.strength || extractMedicineStrength(originalQuery)).trim().slice(0, 40), confidence };
    } catch {
        return null;
    }
}

export async function researchMedicine(name) {
    if (!env.geminiKey) { const error = new Error('MEDICINE_AI_NOT_CONFIGURED'); error.code = 'MEDICINE_AI_NOT_CONFIGURED'; throw error; }
    const prompt = `You are the medicine information assistant for Sanjeevani. Identify generic names, Indian brand names, strengths, and minor misspellings. Return ONLY raw JSON, no markdown:
{"found":true,"confidence":"high|medium|low","searchedName":"","displayName":"","correctedName":"","genericName":"","strength":"","drugClass":"","uses":[],"commonSideEffects":[],"importantWarnings":[],"precautions":[],"simpleExplanation":""}
If identity is uncertain return {"found":false,"confidence":"low","searchedName":"","message":"I could not confidently identify this medicine. Please check the spelling or packaging."}. Use short factual points. Do not diagnose, prescribe, recommend starting/stopping, or give personalized doses. Omit uncertain facts. Input: ${JSON.stringify(name)}`;
    try {
        const ai = new GoogleGenerativeAI(env.geminiKey);
        const response = await ai.getGenerativeModel({ model: 'gemini-3.6-flash', generationConfig: { temperature: 0, responseMimeType: 'application/json' } }).generateContent(prompt);
        const data = JSON.parse(response.response.text().replace(/```json|```/g, '').trim());
        const cleanText = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
        const cleanArray = value => Array.isArray(value) ? value.map(item => cleanText(item, 300)).filter(Boolean).slice(0, 8) : [];
        if (data.found !== true || !['high', 'medium'].includes(data.confidence) || !cleanText(data.displayName || data.genericName, 100)) return { found: false, confidence: 'low', searchedName: name, message: "We couldn't confidently identify this medicine. Check the spelling or try the name written on the medicine packaging." };
        return { found: true, confidence: data.confidence, searchedName: name, displayName: cleanText(data.displayName, 100), correctedName: cleanText(data.correctedName, 100), genericName: cleanText(data.genericName, 160), strength: cleanText(data.strength, 60), drugClass: cleanText(data.drugClass, 160), uses: cleanArray(data.uses), commonSideEffects: cleanArray(data.commonSideEffects), importantWarnings: cleanArray(data.importantWarnings), precautions: cleanArray(data.precautions), simpleExplanation: cleanText(data.simpleExplanation, 600) };
    } catch (cause) { const error = new Error('MEDICINE_AI_UNAVAILABLE'); error.code = 'MEDICINE_AI_UNAVAILABLE'; error.cause = cause; throw error; }
}
