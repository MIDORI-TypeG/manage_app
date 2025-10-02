import { initDatabase, db } from '../models/database.js';

const initDB = async () => {
  try {
    await initDatabase();
    console.log('データベースの初期化が完了しました');
    
    // サンプルデータを挿入
    const sampleData = {
      shifts: [
        {
          name: '田中太郎',
          date: '2024-01-15',
          start_time: '09:00',
          end_time: '17:00',
          memo: '新人研修中',
          understaffed_flag: false
        },
        {
          name: '佐藤花子',
          date: '2024-01-15',
          start_time: '13:00',
          end_time: '21:00',
          memo: '',
          understaffed_flag: false
        }
      ],
      inventory: [
        {
          name: 'ショートケーキ',
          category: 'スイーツ',
          info_memo: '季節限定',
          status: null
        },
        {
          name: 'ブレンド豆',
          category: '焙煎豆',
          info_memo: '深煎り',
          status: null
        },
        {
          name: 'エスプレッソマシン',
          category: '備品',
          info_memo: '定期メンテナンス必要',
          status: '在庫有'
        },
        {
          name: 'コーヒーフィルター',
          category: '備品',
          info_memo: 'サイズ102',
          status: '要発注'
        }
      ],
      notices: [
        {
          title: '新年度研修のお知らせ',
          content: '来月から新年度研修を開始します。詳細は後日連絡いたします。',
          read_status: false
        },
        {
          title: 'システムメンテナンス',
          content: '今週末にシステムメンテナンスを実施します。',
          read_status: false
        }
      ]
    };

    // サンプルシフトデータ挿入
    for (const shift of sampleData.shifts) {
      db.run(
        'INSERT INTO shifts (name, date, start_time, end_time, memo, understaffed_flag) VALUES (?, ?, ?, ?, ?, ?)',
        [shift.name, shift.date, shift.start_time, shift.end_time, shift.memo, shift.understaffed_flag]
      );
    }

    // サンプル在庫データ挿入
    for (const item of sampleData.inventory) {
      db.run(
        'INSERT INTO inventory (name, category, info_memo, status) VALUES (?, ?, ?, ?)',
        [item.name, item.category, item.info_memo, item.status]
      );
    }

    // サンプルお知らせデータ挿入
    for (const notice of sampleData.notices) {
      db.run(
        'INSERT INTO notices (title, content, read_status) VALUES (?, ?, ?)',
        [notice.title, notice.content, notice.read_status]
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
