import express from 'express';
import { db } from '../models/database.js';

const router = express.Router();

// 全在庫取得
router.get('/', (req, res) => {
  const { category } = req.query;

  let query = `
    SELECT id, name, category, info_memo, status, created_at, updated_at
    FROM inventory
  `;
  const params = [];

  if (category) {
    query += ' WHERE category = ? ';
    params.push(category);
  }

  query += ' ORDER BY category, name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 在庫不足アラート取得


// 在庫アイテム作成
router.post('/', (req, res) => {
  const { name, category, info_memo, status = null } = req.body;
  
  if (!name || !category) {
    return res.status(400).json({ error: '商品名とカテゴリは必須です' });
  }

  const query = `
    INSERT INTO inventory (name, category, info_memo, status, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  db.run(query, [name, category, info_memo, status], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      name,
      category,
      info_memo,
      status
    });
  });
});

// 在庫更新
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, info_memo, status } = req.body;
  
  const query = `
    UPDATE inventory 
    SET name = ?, category = ?, info_memo = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [name, category, info_memo, status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '在庫アイテムが見つかりません' });
      return;
    }
    res.json({ message: '在庫が更新されました' });
  });
});

// 在庫入出庫


// 在庫削除
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM inventory WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '在庫アイテムが見つかりません' });
      return;
    }
    res.json({ message: '在庫アイテムが削除されました' });
  });
});

// 在庫ステータス更新
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['要発注', '在庫有'].includes(status)) {
    return res.status(400).json({ error: '無効なステータスです。' });
  }

  const query = `UPDATE inventory SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  db.run(query, [status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '在庫アイテムが見つかりません' });
      return;
    }
    res.json({ message: 'ステータスが更新されました', status });
  });
});

export default router;
