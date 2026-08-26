import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

const candidateModels = [
  "gemini-3.6-flash",
  "gemini-3.6-flash-latest",
  "gemini-3.0-flash"
];

export async function triageSymptoms(symptoms, language = "English") {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in server environment");
  }

  const prompt = `You are SANJEEVANI AI, an emergency healthcare assistant.
Analyze these specific patient symptoms: "${symptoms}" in language: ${language}.

Evaluate the exact severity and urgency:
- "RED": Severe trauma, heart issue, severe breathing difficulty, critical emergency.
- "YELLOW": Moderate symptoms, infection, persistent pain requiring clinic visit in 24-48h.
- "GREEN": Mild, temporary, self-care / rest / hydration.

Respond ONLY with a valid JSON object matching this schema without code blocks:
{
  "alertLevel": "RED" | "YELLOW" | "GREEN",
  "summary": "1-2 sentence specific clinical summary for: ${symptoms}",
  "immediateActions": ["Action 1 for these exact symptoms", "Action 2"],
  "recommendedCare": "Specific medical advice for these symptoms",
  "voiceResponse": "Natural spoken 1-2 sentence response explaining condition in ${language}."
}`;

  const modelCandidates = ["gemini-3.6-flash", "gemini-3.6-flash-latest", "gemini-2.5-flash"];

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.warn(`Model ${modelName} triage failed:`, e.message);
    }
  }

  // REST API Direct Fallback
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
    const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  }

  throw new Error("Gemini API call failed across all endpoints");
}

export async function conductVoiceConsultation(history = [], language = "English") {
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const prompt = `You are SANJEEVANI AI Doctor conducting a live spoken consultation in ${language}.
Analyze the dialogue history:
${JSON.stringify(history, null, 2)}

Protocol:
1. If the patient shares vague or incomplete symptoms, ask 1 concise follow-up question (e.g. pain severity 1-10, swelling, inability to bear weight, duration). Keep isFinalVerdict: false.
2. If red flags or severe trauma appear, set isFinalVerdict: true and alertLevel: "RED".
3. Once clear or after 2-3 turns, set isFinalVerdict: true with alertLevel ("RED", "YELLOW", or "GREEN").

Return strictly JSON:
{
  "isFinalVerdict": boolean,
  "spokenResponse": "Short natural 1-2 sentences to read aloud to patient",
  "alertLevel": "RED" | "YELLOW" | "GREEN" | "IN_PROGRESS",
  "summary": "Clinical summary",
  "recommendedAction": "Next action",
  "immediateActions": ["Step 1", "Step 2"]
}`;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const cleanJson = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.warn(`Consultation model ${modelName} failed:`, e.message);
    }
  }

  throw new Error("Failed to contact Gemini consultation model");
}
