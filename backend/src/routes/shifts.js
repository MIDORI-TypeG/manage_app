import express from 'express';
import { db } from '../models/database.js';

const router = express.Router();

// 全シフト取得（日付範囲指定可能）
router.get('/', (req, res) => {
  const { start_date, end_date } = req.query;
  let query = 'SELECT id, name, date, start_time, end_time, memo, understaffed_flag, created_at, updated_at FROM shifts';
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
  
  db.all('SELECT id, name, date, start_time, end_time, memo, understaffed_flag, created_at, updated_at FROM shifts WHERE date = ? ORDER BY start_time', [date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// シフト作成
router.post('/', (req, res) => {
  const { name, date, start_time, end_time, memo, understaffed_flag = false } = req.body;
  
  if (!name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }

  const query = `
    INSERT INTO shifts (name, date, start_time, end_time, memo, understaffed_flag, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  db.run(query, [name, date, start_time, end_time, memo, understaffed_flag], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      name,
      date,
      start_time,
      end_time,
      memo,
      understaffed_flag
    });
  });
});

// AI入力によるシフト作成 (Placeholder)
router.post('/ai-input', (req, res) => {
  const { name, date, start_time, end_time, memo, understaffed_flag = false } = req.body;

  if (!name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }

  const query = `
    INSERT INTO shifts (name, date, start_time, end_time, memo, understaffed_flag, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  db.run(query, [name, date, start_time, end_time, memo, understaffed_flag], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      name,
      date,
      start_time,
      end_time,
      memo,
      understaffed_flag,
      message: 'AI入力によるシフトが作成されました (AI解析は別途実装が必要です)'
    });
  });
});

// シフト更新
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, date, start_time, end_time, memo, understaffed_flag } = req.body;
  
  const query = `
    UPDATE shifts 
    SET name = ?, date = ?, start_time = ?, end_time = ?, memo = ?, understaffed_flag = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [name, date, start_time, end_time, memo, understaffed_flag, id], function(err) {
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

// シフトの人員不足フラグを切り替え
router.put('/:id/flag', (req, res) => {
  const { id } = req.params;
  const { understaffed_flag } = req.body;

  if (typeof understaffed_flag === 'undefined') {
    return res.status(400).json({ error: 'understaffed_flag が指定されていません' });
  }

  const query = `
    UPDATE shifts 
    SET understaffed_flag = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [understaffed_flag, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'シフトが見つかりません' });
      return;
    }
    res.json({ message: 'シフトの人員不足フラグが更新されました' });
  });
});

export default router;
