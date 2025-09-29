import React, { useState, useEffect, useCallback } from 'react';
import { noticeAPI } from '../services/api.ts';
import { Notice } from '../types';
import { Loader2, Megaphone, Check, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const priorityStyles = {
  high: 'border-l-4 border-red-500',
  normal: 'border-l-4 border-blue-500',
  low: 'border-l-4 border-gray-400',
};

const Noticeboard: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = useCallback(async () => {
    // This component is now always visible, so we don't want to block the UI for long.
    // We set loading to true only on the first fetch.
    if (notices.length === 0) setLoading(true);
    setError(null);
    try {
      const data = await noticeAPI.getAll();
      setNotices(data);
    } catch (err) {
      setError('お知らせの読み込みに失敗しました。');
      console.error(err);
      toast.error('お知らせの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [notices.length]);

  useEffect(() => {
    fetchNotices();
    // Poll for new notices every minute
    const intervalId = setInterval(fetchNotices, 60000);
    return () => clearInterval(intervalId);
  }, [fetchNotices]);

  const handleToggleRead = async (notice: Notice) => {
    const newReadStatus = !notice.is_read;
    setNotices(notices.map(n => n.id === notice.id ? { ...n, is_read: newReadStatus } : n));
    try {
      await noticeAPI.markAsRead(notice.id, newReadStatus);
      toast.success(`お知らせを「${newReadStatus ? '既読' : '未読'}」にしました`);
    } catch (err) {
      setNotices(notices.map(n => n.id === notice.id ? { ...n, is_read: !newReadStatus } : n));
      toast.error('既読状態の更新に失敗しました。');
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotices = notices.filter(n => !n.is_read);
    if (unreadNotices.length === 0) {
      toast.success('すべてのお知らせは既に既読です');
      return;
    }
    const originalNotices = [...notices];
    setNotices(notices.map(n => ({ ...n, is_read: true })));
    try {
      await noticeAPI.markAllAsRead();
      toast.success('すべてのお知らせを既読にしました');
    } catch (err) {
      setNotices(originalNotices);
      toast.error('全件既読処理に失敗しました。');
    }
  };

  const handleDelete = async (noticeId: number) => {
    const noticeToDelete = notices.find(n => n.id === noticeId);
    if (!noticeToDelete || !noticeToDelete.is_read) {
      toast.error('既読のお知らせのみ削除できます。');
      return;
    }

    if (!window.confirm('このお知らせを本当に削除しますか？')) {
      return;
    }
    const originalNotices = [...notices];
    setNotices(notices.filter(n => n.id !== noticeId));
    try {
      await noticeAPI.delete(noticeId);
      toast.success('お知らせを削除しました。');
    } catch (err) {
      setNotices(originalNotices);
      toast.error('お知らせの削除に失敗しました。');
    }
  };

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Megaphone className="w-7 h-7 mr-3 text-blue-500" />
          お知らせ
        </h1>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
          disabled={loading || notices.every(n => n.is_read)}
        >
          <Check className="w-5 h-5 mr-2" />
          すべて既読にする
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="ml-2 text-gray-600">お知らせを読み込んでいます...</p>
        </div>
      )}

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

      {!loading && !error && (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {notices.length > 0 ? (
            notices.map((notice) => (
              <div
                key={notice.id}
                className={`p-4 rounded-lg shadow-sm transition-all ${priorityStyles[notice.priority]} ${notice.is_read ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className={`text-xl font-bold ${notice.is_read ? 'text-gray-600' : 'text-gray-800'}`}>{notice.title}</h2>
                    <p className={`text-sm mt-1 ${notice.is_read ? 'text-gray-500' : 'text-gray-600'}`}>
                      {notice.author && `${notice.author} • `}{format(new Date(notice.created_at), 'yyyy/MM/dd HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleToggleRead(notice)}
                      disabled={loading}
                      className={`flex items-center text-sm px-3 py-1 rounded-full transition-colors ${notice.is_read ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} disabled:opacity-50`}>
                        <Eye className="w-4 h-4 mr-1.5" />
                        {notice.is_read ? '未読にする' : '既読にする'}
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      disabled={loading || !notice.is_read}
                      className="flex items-center text-sm px-3 py-1 rounded-full transition-colors bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className={`mt-3 ${notice.is_read ? 'text-gray-600' : 'text-gray-700'}`}>{notice.content}</p>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-gray-500">新しいお知らせはありません。</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Noticeboard;
