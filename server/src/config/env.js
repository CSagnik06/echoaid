<<<<<<< HEAD

export const env = { port: Number(process.env.PORT || 5000), mongoUri: process.env.MONGODB_URI || '', geminiKey: process.env.GEMINI_API_KEY || '', groqKey: process.env.GROQ_API_KEY || '', clientUrl: process.env.CLIENT_URL || 'http://localhost:5173' };
=======
import 'dotenv/config';
export const env = { port: Number(process.env.PORT || 5000), mongoUri: process.env.MONGODB_URI || '', geminiKey: process.env.GEMINI_API_KEY || '', groqKey: process.env.GROQ_API_KEY || '', clientUrl: process.env.CLIENT_URL || 'http://localhost:5173', supabaseUrl: process.env.SUPABASE_URL || '', supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '' };
>>>>>>> f401b151c89a6f6a4b9be2675f99e040043ae4ac
