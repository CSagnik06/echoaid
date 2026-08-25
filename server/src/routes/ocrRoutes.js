import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// Configure multer to store file in memory
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

router.post('/', upload.single('document'), async (req, res) => {
  try {
    const file = req.file;
    const language = req.body.language || 'English';

    if (!file) {
      return res.status(400).json({ success: false, message: 'No document provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is not configured.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Determine mime type
    const mimeType = file.mimetype;
    
    // Process with Gemini Multimodal
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: file.buffer.toString("base64"),
                mimeType: mimeType
              }
            },
            {
              text: `You are an expert medical AI assistant. Analyze this medical document (report, prescription, or scan). 
1. Extract the key findings, diagnoses, and any abnormal values (e.g. elevated WBC, low hemoglobin).
2. Translate complex clinical jargon into plain, easy-to-understand language.
3. Explain what any abnormal markers mean in practical terms.
4. Output your response entirely in ${language}.
Format your response using Markdown (bullet points, bold text for emphasis). Keep it compassionate and clear.`
            }
          ]
        }
      ]
    });

    const simplifiedText = response.text || "Could not generate an explanation.";

    res.json({
      success: true,
      data: { simplifiedText }
    });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process document', 
      error: error.message 
    });
  }
});

export default router;
