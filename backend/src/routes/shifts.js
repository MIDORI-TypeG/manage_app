import express from 'express';
import { db } from '../models/database.js';

const router = express.Router();

// 全シフト取得（日付範囲指定可能）
router.get('/', (req, res) => {
  const { start_date, end_date } = req.query;
  let query = 'SELECT * FROM shifts';
  let params = [];

  if (start_date && end_date) {
    query += ' WHERE date BETWEEN ? AND ?';
    params = [start_date, end_date];
  }
  
  query += ' ORDER BY date, start_time';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 特定日のシフト取得
router.get('/date/:date', (req, res) => {
  const { date } = req.params;
  
  db.all('SELECT * FROM shifts WHERE date = ? ORDER BY start_time', [date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// シフト作成
router.post('/', (req, res) => {
  const { employee_name, date, start_time, end_time, position, notes } = req.body;
  
  if (!employee_name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }

  const query = `
    INSERT INTO shifts (employee_name, date, start_time, end_time, position, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  db.run(query, [employee_name, date, start_time, end_time, position, notes], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      employee_name,
      date,
      start_time,
      end_time,
      position,
      notes
    });
  });
});

// シフト更新
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { employee_name, date, start_time, end_time, position, notes } = req.body;
  
  const query = `
    UPDATE shifts 
    SET employee_name = ?, date = ?, start_time = ?, end_time = ?, position = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [employee_name, date, start_time, end_time, position, notes, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'シフトが見つかりません' });
      return;
    }
    res.json({ message: 'シフトが更新されました' });
  });
});

// シフト削除
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM shifts WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'シフトが見つかりません' });
      return;
    }
    res.json({ message: 'シフトが削除されました' });
  });
});

export default router;
