import { Router } from 'express';
import multer from 'multer';
import { voiceTranscribe } from '../controllers/voiceController.js';
const r = Router(), upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
r.post('/transcribe', upload.single('audio'), voiceTranscribe);
export default r;
