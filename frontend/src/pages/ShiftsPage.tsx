import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Calendar from 'react-calendar';
import { shiftAPI } from '../services/api.ts';
import { Shift } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Loader2, User, Clock, Trash2, MessageSquare, AlertTriangle, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import 'react-calendar/dist/Calendar.css';

const MINIMUM_STAFF_COUNT = 3;

const ShiftsPage: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeMonth, setActiveMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = format(startOfMonth(activeMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(activeMonth), 'yyyy-MM-dd');
      const data = await shiftAPI.getAll(startDate, endDate);
      setShifts(data);
    } catch (err) {
      setError('シフトの読み込みに失敗しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeMonth]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleDelete = async (shiftId: number) => {
    if (!window.confirm('このシフトを本当に削除しますか？')) {
      return;
    }
    const originalShifts = [...shifts];
    setShifts(shifts.filter(s => s.id !== shiftId));
    try {
      await shiftAPI.delete(shiftId);
      toast.success('シフトを削除しました。');
    } catch (err) {
      setShifts(originalShifts);
      toast.error('シフトの削除に失敗しました。');
    }
  };

  const shiftsByDate = useMemo(() => {
    return shifts.reduce((acc, shift) => {
      const date = shift.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(shift);
      return acc;
    }, {} as Record<string, Shift[]>);
  }, [shifts]);

  const understaffedDays = useMemo(() => {
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(activeMonth), end: endOfMonth(activeMonth) });
    return daysInMonth.filter(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const shiftCount = shiftsByDate[dateStr]?.length || 0;
      return shiftCount > 0 && shiftCount < MINIMUM_STAFF_COUNT;
    });
  }, [shiftsByDate, activeMonth]);

  const selectedDayShifts = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return shiftsByDate[dateStr] || [];
  }, [selectedDate, shiftsByDate]);

  const handleDateChange = (date: Date | Date[]) => {
    if (date instanceof Date) {
      setSelectedDate(date);
    }
  };

  const handleActiveMonthChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      setActiveMonth(activeStartDate);
    }
  };

  const renderTileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayShifts = shiftsByDate[dateStr];
      const isUnderstaffed = understaffedDays.some(d => isSameDay(d, date));

      return (
        <div className="flex items-center justify-center text-xs mt-1 space-x-1">
          {isUnderstaffed && <AlertTriangle className="w-3 h-3 text-red-500" />}
          {dayShifts && dayShifts.length > 0 && (
            <div className="flex items-center text-blue-500">
              <User className="w-3 h-3 mr-0.5" />
              <span>{dayShifts.length}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">シフト管理</h1>
      
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="ml-2 text-gray-600">シフトを読み込んでいます...</p>
        </div>
      )}

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <Calendar
              onChange={handleDateChange as any}
              value={selectedDate}
              onActiveStartDateChange={handleActiveMonthChange}
              tileContent={renderTileContent}
              className="w-full border-none rounded-lg p-2"
            />
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
              <CalendarDays className="w-6 h-6 mr-2 text-gray-500" />
              {format(activeMonth, 'Y年M月')}の情報
            </h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 bg-gray-50 p-3 rounded-lg border">
              <h3 className="font-bold text-gray-600">人員不足の日 ({understaffedDays.length}日)</h3>
              {understaffedDays.length > 0 ? (
                <ul className="space-y-1">
                  {understaffedDays.map(day => (
                    <li key={day.toISOString()}>
                      <button 
                        onClick={() => setSelectedDate(day)}
                        className="w-full text-left p-1.5 rounded-md hover:bg-red-100 flex items-center text-red-600"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        {format(day, 'M月d日 (E)')}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 mt-2">人員不足の日 はありません。</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              {format(selectedDate, 'M月d日 (E)')} のシフト
            </h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {selectedDayShifts.length > 0 ? (
                selectedDayShifts.map((shift) => (
                  <div key={shift.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 group relative">
                    <p className="font-semibold text-gray-800 flex items-center">
                      <User className="w-4 h-4 mr-2 text-blue-500" />
                      {shift.employee_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {shift.start_time} - {shift.end_time}
                    </p>
                    {shift.notes && (
                      <p className="text-sm text-gray-500 mt-1 flex items-start">
                        <MessageSquare className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span>{shift.notes}</span>
                      </p>
                    )}
                    <button
                      onClick={() => handleDelete(shift.id)}
                      disabled={loading}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 disabled:opacity-20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 mt-4">この日のシフトはありません。</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftsPage;
