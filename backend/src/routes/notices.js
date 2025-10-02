import express from 'express';
import { db } from '../models/database.js';

const router = express.Router();

// 全お知らせ取得
router.get('/', (req, res) => {
  const { read_status } = req.query;
  let query = 'SELECT id, title, content, read_status, created_at, updated_at FROM notices';
  let params = [];
  let conditions = [];

  if (read_status !== undefined) {
    conditions.push('read_status = ?');
    params.push(read_status === 'true' ? 1 : 0);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 未読お知らせ数取得
router.get('/unread-count', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM notices WHERE read_status = 0', [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ count: row.count });
  });
});

// 特定お知らせ取得
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT id, title, content, read_status, created_at, updated_at FROM notices WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'お知らせが見つかりません' });
      return;
    }
    res.json(row);
  });
});

// お知らせ作成
router.post('/', (req, res) => {
  const { title, content, read_status = false } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'タイトルと内容は必須です' });
  }

  const query = `
    INSERT INTO notices (title, content, read_status, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  db.run(query, [title, content, read_status], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      title,
      content,
      read_status
    });
  });
});

// お知らせ更新


router.patch('/:id/read-status', (req, res) => {
  const { id } = req.params;
  const { read_status } = req.body;
  
  if (typeof read_status !== 'boolean') {
    return res.status(400).json({ error: 'read_statusはboolean値である必要があります' });
  }
  
  db.run('UPDATE notices SET read_status = ? WHERE id = ?', [read_status ? 1 : 0, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'お知らせが見つかりません' });
      return;
    }
    res.json({ message: '既読状態が更新されました' });
  });
});

// お知らせ削除
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT read_status FROM notices WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'お知らせが見つかりません' });
      return;
    }
    if (!row.read_status) {
      res.status(403).json({ error: '未読のお知らせは削除できません' });
      return;
    }

    db.run('DELETE FROM notices WHERE id = ?', [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'お知らせが削除されました' });
    });
  });
});

export default router;
