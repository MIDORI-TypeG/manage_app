import React from 'react';
import { InventoryItem } from '../types';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  showCategory?: boolean;
  showMinStock?: boolean;
  showUnit?: boolean;
  showCurrentStock?: boolean;
  showInfo?: boolean;
  onStatusChange?: (item: InventoryItem) => void;
  onDeleteItem?: (item: InventoryItem) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ 
  items, 
  loading, 
  error, 
  showCategory = true, 
  showMinStock = true, 
  showUnit = true,
  showCurrentStock = true,
  showInfo = false,
  onStatusChange,
  onDeleteItem
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="ml-2 text-gray-600">在庫リストを読み込んでいます...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">商品名</th>
            {showCategory && <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">カテゴリ</th>}
            {showCurrentStock && <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600">現在庫</th>}
            {showMinStock && <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600">最小在庫</th>}
            {showUnit && <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">単位</th>}
            {showInfo && <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Info</th>}
            <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">状況</th>
            {onDeleteItem && <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600"></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={`border-b border-gray-200 ${item.status === '要発注' ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
              <td className="py-3 px-4 text-gray-800 font-medium">{item.item_name}</td>
              {showCategory && <td className="py-3 px-4 text-gray-600">{item.category || '-'}</td>}
              {showCurrentStock && <td className="py-3 px-4 text-right text-gray-800 font-mono">{item.current_stock}</td>}
              {showMinStock && <td className="py-3 px-4 text-right text-gray-500 font-mono">{item.minimum_stock}</td>}
              {showUnit && <td className="py-3 px-4 text-gray-600">{item.unit}</td>}
              {showInfo && (
                <td className="py-3 px-4 text-gray-600 max-w-xs">
                  {item.notes && (item.notes.startsWith('http://') || item.notes.startsWith('https://')) ? (
                    <a 
                      href={item.notes}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block"
                      title={item.notes}
                    >
                      {item.notes}
                    </a>
                  ) : (
                    <span className="truncate block" title={item.notes || ''}>{item.notes || '-'}</span>
                  )}
                </td>
              )}
              <td className="py-3 px-4 text-center">
                <button 
                  onClick={() => onStatusChange && onStatusChange(item)}
                  disabled={!onStatusChange}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors disabled:cursor-not-allowed ${ 
                    item.status === '要発注' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                  } ${onStatusChange ? 'hover:opacity-80' : ''}`}>
                  {item.status === '要発注' && <AlertTriangle className="w-4 h-4 mr-1.5" />}
                  {item.status}
                </button>
              </td>
              {onDeleteItem && (
                <td className="py-3 px-4 text-center">
                  <button 
                    onClick={() => onDeleteItem(item)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <p className="text-center py-8 text-gray-500">該当する在庫品目はありません。</p>
      )}
    </div>
  );
};

export default InventoryTable;
