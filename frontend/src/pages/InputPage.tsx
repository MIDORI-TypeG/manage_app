import React, { useState } from 'react';
import { shiftAPI, inventoryAPI, noticeAPI } from '../services/api.ts';
import { Shift, InventoryItem, Notice } from '../types';
import toast from 'react-hot-toast';
import { Loader2, Calendar, Archive, Megaphone, Sparkles } from 'lucide-react';

// 共通のフォーム要素のスタイル
const inputStyle = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
const buttonStyle = "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400";

// --- AI入力の解析ロジック ---
const parseShiftText = (text: string): Partial<ShiftFormData> => {
  const parsed: Partial<ShiftFormData> = {};
  let remainingText = text;

  // 日付 (例: 10/25, 10月25日)
  const dateRegex = /(\d{1,2})[\/\u6708](\d{1,2})[\u65e5]?/;
  const dateMatch = remainingText.match(dateRegex);
  if (dateMatch) {
    const month = dateMatch[1].padStart(2, '0');
    const day = dateMatch[2].padStart(2, '0');
    const year = new Date().getFullYear();
    parsed.date = `${year}-${month}-${day}`;
    remainingText = remainingText.replace(dateRegex, '');
  }

  // 時間 (例: 10:00-17:00, 10時~17時, 10時から17時まで)
  const timeRegex = /(\d{1,2}):?(\d{2})?\s*[~\-~\u304b\u3089\u6642]?\s*(\d{1,2}):?(\d{2})?/;
  const timeMatch = remainingText.match(timeRegex);
  if (timeMatch) {
    const startHour = timeMatch[1].padStart(2, '0');
    const startMinute = timeMatch[2] || '00';
    const endHour = timeMatch[3].padStart(2, '0');
    const endMinute = timeMatch[4] || '00';
    parsed.start_time = `${startHour}:${startMinute}`;
    parsed.end_time = `${endHour}:${endMinute}`;
    remainingText = remainingText.replace(timeRegex, '');
  }

  // 名前 (最初の単語と仮定)
  remainingText = remainingText.trim();
  const nameMatch = remainingText.match(/^(\S+)/);
  if (nameMatch) {
    parsed.employee_name = nameMatch[1];
    remainingText = remainingText.replace(nameMatch[1], '').trim();
  }

  // メモ (残り全部)
  parsed.notes = remainingText;

  return parsed;
};


// --- シフト入力フォーム ---
type ShiftFormData = Omit<Shift, 'id' | 'created_at' | 'updated_at' | 'position'>;
const ShiftForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<ShiftFormData>>({ employee_name: '', date: '', start_time: '', end_time: '', notes: '' });
  const [aiInput, setAiInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAiInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAiInput(text);
    const parsedData = parseShiftText(text);
    setFormData(current => ({ ...current, ...parsedData }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_name || !formData.date || !formData.start_time || !formData.end_time) {
      return toast.error('必須項目（名前、日付、開始・終了時間）を入力してください。');
    }
    setLoading(true);
    try {
      await shiftAPI.create(formData as ShiftFormData);
      toast.success('シフトを登録しました。');
      setFormData({ employee_name: '', date: '', start_time: '', end_time: '', notes: '' });
      setAiInput('');
    } catch (error) {
      toast.error('シフトの登録に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="employee_name" className={labelStyle}>名前 *</label>
          <input type="text" name="employee_name" value={formData.employee_name} onChange={handleChange} className={inputStyle} required />
        </div>
        <div>
          <label htmlFor="date" className={labelStyle}>日付 *</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputStyle} required />
        </div>
        <div>
          <label htmlFor="start_time" className={labelStyle}>開始時間 *</label>
          <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className={inputStyle} required />
        </div>
        <div>
          <label htmlFor="end_time" className={labelStyle}>終了時間 *</label>
          <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className={inputStyle} required />
        </div>
      </div>
      <div>
        <label htmlFor="notes" className={labelStyle}>メモ</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className={inputStyle}></textarea>
      </div>
      <hr />
      <div className="relative">
        <label htmlFor="ai_input" className={`${labelStyle} flex items-center`}>
          <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
          AI入力
        </label>
        <textarea 
          id="ai_input"
          name="ai_input"
          value={aiInput}
          onChange={handleAiInputChange}
          rows={3} 
          className={inputStyle}
          placeholder="例: 田中 10/25 10時から17時まで ホール担当"
        />
      </div>
      <button type="submit" disabled={loading} className={buttonStyle}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'シフトを登録'}
      </button>
    </form>
  );
};

// --- 在庫入力フォーム ---
type InventoryFormData = Pick<InventoryItem, 'item_name' | 'notes'>;
const InventoryForm: React.FC = () => {
  const [formData, setFormData] = useState<InventoryFormData>({ item_name: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_name) {
      return toast.error('商品名は必須です。');
    }
    setLoading(true);
    try {
      // @ts-ignore
      await inventoryAPI.create(formData);
      toast.success('在庫品目を登録しました。');
      setFormData({ item_name: '', notes: '' });
    } catch (error) {
      toast.error('在庫品目の登録に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="item_name" className={labelStyle}>商品名 *</label>
        <input type="text" name="item_name" value={formData.item_name} onChange={handleChange} className={inputStyle} required />
      </div>
      <div>
        <label htmlFor="notes" className={labelStyle}>Info</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className={inputStyle}></textarea>
      </div>
      <button type="submit" disabled={loading} className={buttonStyle}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '在庫品目を登録'}
      </button>
    </form>
  );
};

// --- お知らせ入力フォーム ---
type NoticeFormData = Omit<Notice, 'id' | 'is_read' | 'created_at' | 'updated_at' | 'priority'>;
const NoticeForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<NoticeFormData>>({ title: '', content: '', author: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      return toast.error('タイトルと内容は必須です。');
    }
    setLoading(true);
    try {
      await noticeAPI.create(formData as NoticeFormData);
      toast.success('お知らせを登録しました。');
      setFormData({ title: '', content: '', author: '' });
    } catch (error) {
      toast.error('お知らせの登録に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className={labelStyle}>タイトル *</label>
        <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputStyle} required />
      </div>
      <div>
        <label htmlFor="content" className={labelStyle}>内容 *</label>
        <textarea name="content" value={formData.content} onChange={handleChange} rows={4} className={inputStyle} required></textarea>
      </div>
      <div>
        <label htmlFor="author" className={labelStyle}>作成者</label>
        <input type="text" name="author" value={formData.author} onChange={handleChange} className={inputStyle} />
      </div>
      <button type="submit" disabled={loading} className={buttonStyle}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'お知らせを登録'}
      </button>
    </form>
  );
};

// --- メインコンポーネント ---
type Tab = 'shift' | 'inventory' | 'notice';

const InputPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('shift');

  const tabs = [
    { id: 'shift', label: 'シフト', icon: Calendar },
    { id: 'inventory', label: '在庫', icon: Archive },
    { id: 'notice', label: 'お知らせ', icon: Megaphone },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">情報入力</h1>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className={`w-5 h-5 mr-2 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6 bg-gray-50 rounded-lg">
        {activeTab === 'shift' && <ShiftForm />}
        {activeTab === 'inventory' && <InventoryForm />}
        {activeTab === 'notice' && <NoticeForm />}
      </div>
    </div>
  );
};

export default InputPage;
