import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api.ts';
import { InventoryItem } from '../types';
import { Loader2, AlertTriangle, Archive } from 'lucide-react';

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await inventoryAPI.getAll();
        setItems(data);
      } catch (err) {
        setError('在庫の読み込みに失敗しました。');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center">
        <Archive className="w-8 h-8 mr-3 text-blue-500" />
        在庫管理
      </h1>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="ml-2 text-gray-600">在庫リストを読み込んでいます...</p>
        </div>
      )}

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">商品名</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">カテゴリ</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600">現在庫</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600">最小在庫</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">単位</th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">状況</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={`border-b border-gray-200 ${item.is_low_stock ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                  <td className="py-3 px-4 text-gray-800 font-medium">{item.item_name}</td>
                  <td className="py-3 px-4 text-gray-600">{item.category || '-'}</td>
                  <td className="py-3 px-4 text-right text-gray-800 font-mono">{item.current_stock}</td>
                  <td className="py-3 px-4 text-right text-gray-500 font-mono">{item.minimum_stock}</td>
                  <td className="py-3 px-4 text-gray-600">{item.unit}</td>
                  <td className="py-3 px-4 text-center">
                    {item.is_low_stock && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-4 h-4 mr-1.5" />
                        要発注
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="text-center py-8 text-gray-500">在庫品目はまだ登録されていません。</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
