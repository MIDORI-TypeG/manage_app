import express from 'express';
import { db } from '../models/database.js';

const router = express.Router();

// 特定の月のフラグを取得
router.get('/', (req, res) => {
  const { month } = req.query; // month format: YYYY-MM

  if (!month) {
    return res.status(400).json({ error: 'monthクエリパラメータは必須です。' });
  }

  const query = `SELECT date, is_flagged FROM daily_flags WHERE date LIKE ? || '%'`;
  db.all(query, [month], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 日付のフラグを設定/更新
router.post('/', (req, res) => {
  const { date, is_flagged } = req.body;

  if (!date || typeof is_flagged === 'undefined') {
    return res.status(400).json({ error: 'dateとis_flaggedは必須です。' });
  }

  const query = `
    INSERT INTO daily_flags (date, is_flagged)
    VALUES (?, ?)
    ON CONFLICT(date) DO UPDATE SET is_flagged = EXCLUDED.is_flagged
  `;

  db.run(query, [date, is_flagged ? 1 : 0], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'フラグが更新されました', date, is_flagged });
  });
});

export default router;
