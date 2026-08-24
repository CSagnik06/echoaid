import 'dotenv/config';
export const env = { port: Number(process.env.PORT || 5000), mongoUri: process.env.MONGODB_URI || '', geminiKey: process.env.GEMINI_API_KEY || '', groqKey: process.env.GROQ_API_KEY || '', clientUrl: process.env.CLIENT_URL || 'http://localhost:5173' };
