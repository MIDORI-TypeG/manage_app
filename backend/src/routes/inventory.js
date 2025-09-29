import express from 'express';
import { db } from '../models/database.js';

const router = express.Router();

// 全在庫取得
router.get('/', (req, res) => {
  const { category } = req.query;

  let query = `
    SELECT i.*, 
           CASE WHEN i.current_stock <= i.minimum_stock THEN 1 ELSE 0 END as is_low_stock
    FROM inventory i
  `;
  const params = [];

  if (category) {
    if (category === 'その他') {
      query += ' WHERE (i.category IS NULL OR (i.category != ? AND i.category != ?)) ';
      params.push('スイーツ', '焙煎豆');
    } else {
      query += ' WHERE i.category = ? ';
      params.push(category);
    }
  }

  query += ' ORDER BY i.category, i.item_name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 在庫不足アラート取得
router.get('/alerts', (req, res) => {
  db.all('SELECT * FROM inventory WHERE current_stock <= minimum_stock', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 在庫履歴取得
router.get('/:id/history', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT h.*, i.item_name
    FROM inventory_history h
    JOIN inventory i ON h.item_id = i.id
    WHERE h.item_id = ?
    ORDER BY h.created_at DESC
    LIMIT 50
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 在庫アイテム作成
router.post('/', (req, res) => {
  const { item_name, current_stock, minimum_stock, unit, category, notes } = req.body;
  
  if (!item_name) {
    return res.status(400).json({ error: '商品名は必須です' });
  }

  const query = `
    INSERT INTO inventory (item_name, current_stock, minimum_stock, unit, category, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  db.run(query, [item_name, current_stock || 0, minimum_stock || 0, unit || '個', category, notes], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      item_name,
      current_stock: current_stock || 0,
      minimum_stock: minimum_stock || 0,
      unit: unit || '個',
      category,
      notes
    });
  });
});

// 在庫更新
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { item_name, current_stock, minimum_stock, unit, category, notes } = req.body;
  
  const query = `
    UPDATE inventory 
    SET item_name = ?, current_stock = ?, minimum_stock = ?, unit = ?, category = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [item_name, current_stock, minimum_stock, unit, category, notes, id], function(err) {
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
router.post('/:id/stock-change', (req, res) => {
  const { id } = req.params;
  const { change_type, quantity, reason } = req.body;
  
  if (!change_type || !quantity) {
    return res.status(400).json({ error: '入出庫タイプと数量は必須です' });
  }
  
  if (!['in', 'out'].includes(change_type)) {
    return res.status(400).json({ error: '入出庫タイプは "in" または "out" である必要があります' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 現在の在庫を取得
    db.get('SELECT current_stock FROM inventory WHERE id = ?', [id], (err, row) => {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (!row) {
        db.run('ROLLBACK');
        res.status(404).json({ error: '在庫アイテムが見つかりません' });
        return;
      }
      
      const newStock = change_type === 'in' 
        ? row.current_stock + quantity 
        : row.current_stock - quantity;
      
      if (newStock < 0) {
        db.run('ROLLBACK');
        res.status(400).json({ error: '在庫数が不足しています' });
        return;
      }
      
      // 在庫更新
      db.run('UPDATE inventory SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [newStock, id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          
          // 履歴追加
          db.run('INSERT INTO inventory_history (item_id, change_type, quantity, reason) VALUES (?, ?, ?, ?)', 
            [id, change_type, quantity, reason], (err) => {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              
              db.run('COMMIT');
              res.json({ 
                message: '在庫が更新されました',
                new_stock: newStock 
              });
            }
          );
        }
      );
    });
  });
});

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
