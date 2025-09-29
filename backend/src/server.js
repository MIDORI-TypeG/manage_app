import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import shiftRoutes from './routes/shifts.js';
import inventoryRoutes from './routes/inventory.js';
import noticeRoutes from './routes/notices.js';
import flagsRoutes from './routes/flags.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェア
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// ルート設定
app.use('/api/shifts', shiftRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/flags', flagsRoutes);

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'サーバーエラーが発生しました',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
  console.log(`API URL: http://localhost:${PORT}/api`);
});
