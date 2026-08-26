import express from 'express';
import { getMedicineLabel, searchMedicineLabels } from '../services/medicineService.js';

const router = express.Router();

router.get('/search', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < 2 || query.length > 80) return res.status(400).json({ success: false, message: 'Enter between 2 and 80 characters.' });
    const results = await searchMedicineLabels(query);
    res.json({ success: true, data: results });
  } catch (error) { next(error); }
});

router.get('/labels/:id', async (req, res, next) => {
  try {
    const result = await getMedicineLabel(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Reliable medicine information was not found.' });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.use((error, _req, res, _next) => {
  if (error.message === 'MEDICINE_PROVIDER_UNAVAILABLE') return res.status(503).json({ success: false, message: "Medicine information is temporarily unavailable. Please try again." });
  console.error('Medicine information request failed:', error.message);
  res.status(500).json({ success: false, message: 'Medicine information could not be loaded.' });
});

export default router;
