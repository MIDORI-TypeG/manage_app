import express from 'express';
import { db } from '../models/database.js';

const router = express.Router();

// 全お知らせ取得
router.get('/', (req, res) => {
  const { priority, is_read } = req.query;
  let query = 'SELECT * FROM notices';
  let params = [];
  let conditions = [];

  if (priority) {
    conditions.push('priority = ?');
    params.push(priority);
  }
  
  if (is_read !== undefined) {
    conditions.push('is_read = ?');
    params.push(is_read === 'true' ? 1 : 0);
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
  db.get('SELECT COUNT(*) as count FROM notices WHERE is_read = 0', [], (err, row) => {
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
  
  db.get('SELECT * FROM notices WHERE id = ?', [id], (err, row) => {
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
  const { title, content, priority, author } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'タイトルと内容は必須です' });
  }

  const validPriorities = ['high', 'normal', 'low'];
  const finalPriority = validPriorities.includes(priority) ? priority : 'normal';

  const query = `
    INSERT INTO notices (title, content, priority, author, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  db.run(query, [title, content, finalPriority, author], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      title,
      content,
      priority: finalPriority,
      author,
      is_read: false
    });
  });
});

// お知らせ更新
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, priority, author } = req.body;
  
  const validPriorities = ['high', 'normal', 'low'];
  const finalPriority = validPriorities.includes(priority) ? priority : 'normal';
  
  const query = `
    UPDATE notices 
    SET title = ?, content = ?, priority = ?, author = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [title, content, finalPriority, author, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'お知らせが見つかりません' });
      return;
    }
    res.json({ message: 'お知らせが更新されました' });
  });
});

// 既読/未読切り替え
router.patch('/:id/read-status', (req, res) => {
  const { id } = req.params;
  const { is_read } = req.body;
  
  if (typeof is_read !== 'boolean') {
    return res.status(400).json({ error: 'is_readはboolean値である必要があります' });
  }
  
  db.run('UPDATE notices SET is_read = ? WHERE id = ?', [is_read ? 1 : 0, id], function(err) {
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

// 全既読化
router.patch('/mark-all-read', (req, res) => {
  db.run('UPDATE notices SET is_read = 1', [], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ 
      message: '全てのお知らせを既読にしました',
      updated_count: this.changes 
    });
  });
});

// お知らせ削除
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM notices WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'お知らせが見つかりません' });
      return;
    }
    res.json({ message: 'お知らせが削除されました' });
  });
});

export default router;
