import { initDatabase, db } from '../models/database.js';

const initDB = async () => {
  try {
    await initDatabase();
    console.log('データベースの初期化が完了しました');
    
    // サンプルデータを挿入
    const sampleData = {
      shifts: [
        {
          employee_name: '田中太郎',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '17:00',
          position: 'フロア',
          notes: '新人研修中'
        },
        {
          employee_name: '佐藤花子',
          date: '2024-01-15',
          start_time: '13:00',
          end_time: '21:00',
          position: 'レジ',
          notes: ''
        }
      ],
      inventory: [
        {
          item_name: 'コピー用紙',
          current_stock: 50,
          minimum_stock: 10,
          unit: '束',
          category: '事務用品',
          notes: 'A4サイズ'
        },
        {
          item_name: 'ボールペン',
          current_stock: 5,
          minimum_stock: 20,
          unit: '本',
          category: '事務用品',
          notes: '黒色のみ'
        }
      ],
      notices: [
        {
          title: '新年度研修のお知らせ',
          content: '来月から新年度研修を開始します。詳細は後日連絡いたします。',
          priority: 'high',
          author: '管理者'
        },
        {
          title: 'システムメンテナンス',
          content: '今週末にシステムメンテナンスを実施します。',
          priority: 'normal',
          author: 'IT部'
        }
      ]
    };

    // サンプルシフトデータ挿入
    for (const shift of sampleData.shifts) {
      db.run(
        'INSERT INTO shifts (employee_name, date, start_time, end_time, position, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [shift.employee_name, shift.date, shift.start_time, shift.end_time, shift.position, shift.notes]
      );
    }

    // サンプル在庫データ挿入
    for (const item of sampleData.inventory) {
      db.run(
        'INSERT INTO inventory (item_name, current_stock, minimum_stock, unit, category, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [item.item_name, item.current_stock, item.minimum_stock, item.unit, item.category, item.notes]
      );
    }

    // サンプルお知らせデータ挿入
    for (const notice of sampleData.notices) {
      db.run(
        'INSERT INTO notices (title, content, priority, author) VALUES (?, ?, ?, ?)',
        [notice.title, notice.content, notice.priority, notice.author]
      );
    }

    console.log('サンプルデータの挿入が完了しました');
    
  } catch (error) {
    console.error('データベース初期化エラー:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('データベースクローズエラー:', err.message);
      } else {
        console.log('データベース接続を閉じました');
      }
    });
  }
};

initDB();
