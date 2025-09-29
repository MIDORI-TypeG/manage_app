import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api.ts';
import { InventoryItem } from '../types';
import InventoryTable from '../components/InventoryTable.tsx';
import { Archive } from 'lucide-react';

const OtherInventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await inventoryAPI.getAll({ category: 'その他' });
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
        <Archive className="w-8 h-8 mr-3 text-gray-500" />
        その他在庫
      </h1>
      <InventoryTable items={items} loading={loading} error={error} />
    </div>
  );
};

export default OtherInventoryPage;
