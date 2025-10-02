import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { shiftAPI, flagsAPI } from '../services/api';
import { Shift, DailyFlag } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

// 日本語ロケール設定
LocaleConfig.locales['ja'] = {
  monthNames: [
    '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月',
  ],
  monthNamesShort: [
    '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月',
  ],
  dayNames: [
    '日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日',
  ],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日',
};
LocaleConfig.defaultLocale = 'ja';

const MINIMUM_STAFF_COUNT = 3;

const ShiftsScreen: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [dailyFlags, setDailyFlags] = useState<DailyFlag[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeMonth, setActiveMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShiftsAndFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const monthStr = format(activeMonth, 'yyyy-MM');
      const startDate = format(startOfMonth(activeMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(activeMonth), 'yyyy-MM-dd');

      const [shiftsData, flagsData] = await Promise.all([
        shiftAPI.getAll(startDate, endDate),
        flagsAPI.getForMonth(monthStr),
      ]);
      setShifts(shiftsData);
      setDailyFlags(flagsData);
    } catch (err) {
      setError('シフト情報の読み込みに失敗しました。');
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: 'シフト情報の読み込みに失敗しました。',
      });
    } finally {
      setLoading(false);
    }
  }, [activeMonth]);

  useEffect(() => {
    fetchShiftsAndFlags();
  }, [fetchShiftsAndFlags]);

  const handleDelete = async (shiftId: number) => {
    Alert.alert(
      'シフト削除',
      'このシフトを本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          onPress: async () => {
            const originalShifts = [...shifts];
            setShifts(shifts.filter((s) => s.id !== shiftId));
            try {
              await shiftAPI.delete(shiftId);
              Toast.show({
                type: 'success',
                text1: '成功',
                text2: 'シフトを削除しました。',
              });
              fetchShiftsAndFlags(); // 再フェッチして月間サマリーを更新
            } catch (err) {
              setShifts(originalShifts);
              Toast.show({
                type: 'error',
                text1: 'エラー',
                text2: 'シフトの削除に失敗しました。',
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleToggleFlag = async (date: string) => {
    const currentFlag = dailyFlags.find((flag) => flag.date === date);
    const newFlagStatus = !currentFlag?.is_flagged;

    // Optimistic UI update
    setDailyFlags((prevFlags) => {
      const updatedFlags = prevFlags.filter((flag) => flag.date !== date);
      if (newFlagStatus) {
        updatedFlags.push({ date, is_flagged: true });
      }
      return updatedFlags;
    });

    try {
      await flagsAPI.setFlag(date, newFlagStatus);
      Toast.show({
        type: 'success',
        text1: '成功',
        text2: `人員不足フラグを${newFlagStatus ? '設定' : '解除'}しました。`,
      });
      fetchShiftsAndFlags(); // 再フェッチして月間サマリーを更新
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: 'フラグの更新に失敗しました。',
      }
      );
      fetchShiftsAndFlags(); // エラー時は元に戻すために再フェッチ
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
    return daysInMonth.filter((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const shiftCount = shiftsByDate[dateStr]?.length || 0;
      const manualFlag = dailyFlags.find((flag) => flag.date === dateStr)?.is_flagged;

      return manualFlag || (shiftCount > 0 && shiftCount < MINIMUM_STAFF_COUNT);
    });
  }, [shiftsByDate, activeMonth, dailyFlags]);

  const selectedDayShifts = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return shiftsByDate[dateStr] || [];
  }, [selectedDate, shiftsByDate]);

  const markedDates = useMemo(() => {
    const marks: { [key: string]: any } = {};
    shifts.forEach((shift) => {
      const dateStr = shift.date;
      if (!marks[dateStr]) {
        marks[dateStr] = { dots: [] };
      }
      marks[dateStr].dots.push({ key: shift.id, color: 'blue' });
    });

    understaffedDays.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (!marks[dateStr]) {
        marks[dateStr] = { dots: [] };
      }
      // Add a red dot for understaffed days
      marks[dateStr].dots.push({ key: 'understaffed', color: 'red' });
    });

    // Highlight selected date
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    marks[selectedDateStr] = { ...marks[selectedDateStr], selected: true, selectedColor: '#3b82f6' };

    return marks;
  }, [shifts, understaffedDays, selectedDate]);

  const isSelectedDayUnderstaffed = useMemo(() => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return understaffedDays.some(d => isSameDay(d, selectedDate));
  }, [selectedDate, understaffedDays]);

  const selectedDayFlag = useMemo(() => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return dailyFlags.find(flag => flag.date === selectedDateStr)?.is_flagged;
  }, [selectedDate, dailyFlags]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>シフト情報を読み込み中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>シフト管理</Text>

      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={(day) => setSelectedDate(new Date(day.dateString))}
          onMonthChange={(month) => setActiveMonth(new Date(month.dateString))}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            selectedDayBackgroundColor: '#3b82f6',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#3b82f6',
            arrowColor: '#3b82f6',
            dotColor: '#3b82f6',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
        />
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>
          {format(activeMonth, 'yyyy年M月')}の情報
        </Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>人員不足の日 ({understaffedDays.length}日)</Text>
          {understaffedDays.length > 0 ? (
            <View>
              {understaffedDays.map((day) => (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={styles.understaffedDayItem}
                  onPress={() => setSelectedDate(day)}
                >
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#ef4444" />
                  <Text style={styles.understaffedDayText}>
                    {format(day, 'M月d日 (E)')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.infoBoxText}>人員不足の日 はありません。</Text>
          )}
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>
          {format(selectedDate, 'M月d日 (E)')} のシフト
        </Text>
        <TouchableOpacity
          style={[styles.flagButton, selectedDayFlag ? styles.flagButtonActive : {}]}
          onPress={() => handleToggleFlag(format(selectedDate, 'yyyy-MM-dd'))}
        >
          <MaterialCommunityIcons 
            name={selectedDayFlag ? "flag" : "flag-outline"} 
            size={20} 
            color={selectedDayFlag ? "#ffffff" : "#3b82f6"} 
          />
          <Text style={[styles.flagButtonText, selectedDayFlag ? styles.flagButtonTextActive : {}]}>
            {selectedDayFlag ? '人員不足フラグを解除' : '人員不足としてマーク'}
          </Text>
        </TouchableOpacity>

        {selectedDayShifts.length > 0 ? (
          selectedDayShifts.map((shift) => (
            <View key={shift.id} style={styles.shiftItem}>
              <View style={styles.shiftDetails}>
                <MaterialCommunityIcons name="account" size={18} color="#3b82f6" />
                <Text style={styles.shiftText}>{shift.employee_name}</Text>
              </View>
              <View style={styles.shiftDetails}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#64748b" />
                <Text style={styles.shiftText}>{shift.start_time} - {shift.end_time}</Text>
              </View>
              {shift.notes && (
                <View style={styles.shiftDetails}>
                  <MaterialCommunityIcons name="note-text-outline" size={18} color="#64748b" />
                  <Text style={styles.shiftText}>{shift.notes}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(shift.id)}
              >
                <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noShiftText}>この日のシフトはありません。</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1e293b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  calendarContainer: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1e293b',
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#334155',
  },
  infoBoxText: {
    fontSize: 14,
    color: '#64748b',
  },
  understaffedDayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  understaffedDayText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ef4444',
  },
  shiftItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  shiftDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shiftText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#334155',
  },
  noShiftText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  flagButtonActive: {
    backgroundColor: '#3b82f6',
  },
  flagButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  flagButtonTextActive: {
    color: '#ffffff',
  },
});

export default ShiftsScreen;