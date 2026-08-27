import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.6-flash-latest",
  "gemini-2.5-flash"
];

export async function triageSymptoms(symptoms, language = "English") {
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing in server environment");

  const prompt = `You are SANJEEVANI AI, an emergency clinical triage system.
Analyze these patient symptoms: "${symptoms}" in ${language}.

Determine clinical urgency strictly as:
- "RED": Critical / severe emergency (immediate emergency care needed)
- "YELLOW": Moderate / non-emergency (clinic evaluation within 24-48h)
- "GREEN": Mild / negligible (home rest, hydration, monitoring)

Return ONLY a valid JSON object without markdown fences:
{
  "alertLevel": "RED" | "YELLOW" | "GREEN",
  "summary": "1-2 sentence clinical summary directly tailored to: ${symptoms}",
  "immediateActions": ["Specific action 1", "Specific action 2"],
  "recommendedCare": "Recommended care instructions",
  "voiceResponse": "Natural spoken 1-2 sentence clinical response in ${language}."
}`;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const clean = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(clean);
    } catch (err) {
      console.warn(`Triage model ${modelName} failed:`, err.message);
    }
  }

  // REST Fallback
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (rawText) {
    return JSON.parse(rawText.replace(/```json/gi, "").replace(/```/g, "").trim());
  }

  throw new Error("Unable to contact Gemini AI for symptom analysis.");
}

export async function conductVoiceConsultation(history = [], language = "English") {
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing in server environment");

  const prompt = `You are SANJEEVANI AI Doctor conducting an interactive medical consultation in ${language}.
Dialogue history:
${JSON.stringify(history, null, 2)}

Rules:
1. If information is incomplete or vague, ask 1 focused follow-up question (severity 1-10, duration, fever, red-flag signs) and keep isFinalVerdict: false.
2. If red-flags appear or conversation is mature (2-3 turns), finalize with isFinalVerdict: true and alertLevel ("RED", "YELLOW", or "GREEN").

Return ONLY valid JSON:
{
  "isFinalVerdict": boolean,
  "spokenResponse": "Short 1-2 sentence response to be read aloud to the patient",
  "alertLevel": "RED" | "YELLOW" | "GREEN" | "IN_PROGRESS",
  "summary": "Medical summary",
  "recommendedAction": "Next action",
  "immediateActions": ["Action 1", "Action 2"]
}`;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const clean = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(clean);
    } catch (err) {
      console.warn(`Consultation model ${modelName} failed:`, err.message);
    }
  }

  throw new Error("Unable to contact Gemini AI consultation engine.");
}
