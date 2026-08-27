import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Only confirmed-available models — others return 404 from the Gemini API.
const candidateModels = [
  "gemini-3.6-flash",
];


export async function simplifyMedicalDocument(fileBuffer, mimeType = "image/png", language = "English") {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in server environment");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `You are an expert medical communicator.
Analyze the provided diagnostic medical report/prescription image thoroughly.
Translate and explain all findings clearly in ${language}.

Format strictly with these markdown sections:
📌 Key Findings & Summary
⚠️ Values & Observations to Note (Highlight abnormal, elevated, or low parameters with reference ranges)
💡 Plain Language Explanation
🩺 Suggested Questions for Your Doctor

End with a standard clinical disclaimer.`;

  const base64Data = fileBuffer.toString("base64");
  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType || "image/png"
    }
  };

  let lastError = null;

  // Attempt 1: Official SDK model cascade
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, imagePart]);
      if (result && result.response) {
        console.log(`[Gemini Engine] Generated report analysis using: ${modelName}`);
        return result.response.text();
      }
    } catch (err) {
      console.warn(`[Gemini Engine] Model ${modelName} failed (${err.message}), trying next candidate...`);
      lastError = err;
    }
  }

  // Attempt 2: Direct REST fallback to gemini-3.6-flash
  for (const modelName of candidateModels) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType || "image/png", data: base64Data } }
            ]
          }]
        })
      });

      const data = await res.json();
      if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`[Gemini REST] Fallback succeeded with: ${modelName}`);
        return data.candidates[0].content.parts[0].text;
      }
    } catch (restErr) {
      console.warn(`[Gemini REST] Fallback ${modelName} failed:`, restErr.message);
    }
  }

  throw new Error(lastError?.message || "Failed to generate report with available Gemini models.");
}

router.post('/', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No document uploaded" });
    }
    const text = await simplifyMedicalDocument(req.file.buffer, req.file.mimetype, req.body.language);
    return res.json({ success: true, data: { simplifiedText: text } });
  } catch (error) {
    console.error("Report Processing Error Details:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
