import React, { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../services/api.ts';
import { InventoryItem } from '../types';
import InventoryTable from '../components/InventoryTable.tsx';
import { Coffee } from 'lucide-react';
import toast from 'react-hot-toast';

const BeansPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryAPI.getAll({ category: '焙煎豆' });
      setItems(data);
    } catch (err) {
      setError('在庫の読み込みに失敗しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (itemToDelete: InventoryItem) => {
    if (!window.confirm(`「${itemToDelete.item_name}」を本当に削除しますか？`)) {
      return;
    }
    const originalItems = [...items];
    setItems(items.filter(item => item.id !== itemToDelete.id));
    try {
      await inventoryAPI.delete(itemToDelete.id);
      toast.success('アイテムを削除しました。');
    } catch (error) {
      setItems(originalItems);
      toast.error('アイテムの削除に失敗しました。');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center">
        <Coffee className="w-8 h-8 mr-3 text-yellow-700" />
        焙煎豆在庫
      </h1>
      <InventoryTable 
        items={items} 
        loading={loading} 
        error={error} 
        showCategory={false}
        showMinStock={false}
        showUnit={false}
        onDeleteItem={handleDelete}
      />
    </div>
  );
};

export default BeansPage;
