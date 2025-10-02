import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Appbar, TextInput, Button, SegmentedButtons, RadioButton, Dialog, Portal } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { shiftAPI, inventoryAPI, noticeAPI } from '../services/api';
import { Shift, InventoryItem, Notice } from '../types';
import { format } from 'date-fns';

// --- AI入力の解析ロジック (Web版から移植) ---
const parseShiftText = (text: string): Partial<Shift> => {
  const parsed: Partial<Shift> = {};
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

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleAiInputChange = (text: string) => {
    setAiInput(text);
    const parsedData = parseShiftText(text);
    setFormData(current => ({ ...current, ...parsedData }));
  };

  const handleSubmit = async () => {
    if (!formData.employee_name || !formData.date || !formData.start_time || !formData.end_time) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '必須項目（名前、日付、開始・終了時間）を入力してください。',
      });
      return;
    }
    setLoading(true);
    try {
      await shiftAPI.create(formData as Shift);
      Toast.show({
        type: 'success',
        text1: '成功',
        text2: 'シフトを登録しました。',
      });
      setFormData({ employee_name: '', date: '', start_time: '', end_time: '', notes: '' });
      setAiInput('');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: 'シフトの登録に失敗しました。',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <TextInput
        label="名前 *"
        value={formData.employee_name}
        onChangeText={(text) => handleChange('employee_name', text)}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="日付 *"
        value={formData.date}
        onChangeText={(text) => handleChange('date', text)}
        style={styles.input}
        mode="outlined"
        placeholder="YYYY-MM-DD"
      />
      <TextInput
        label="開始時間 *"
        value={formData.start_time}
        onChangeText={(text) => handleChange('start_time', text)}
        style={styles.input}
        mode="outlined"
        placeholder="HH:MM"
      />
      <TextInput
        label="終了時間 *"
        value={formData.end_time}
        onChangeText={(text) => handleChange('end_time', text)}
        style={styles.input}
        mode="outlined"
        placeholder="HH:MM"
      />
      <TextInput
        label="メモ"
        value={formData.notes}
        onChangeText={(text) => handleChange('notes', text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.aiInputSection}>
        <Text style={styles.aiInputLabel}>
          <MaterialCommunityIcons name="sparkles" size={18} color="#facc15" /> AI入力
        </Text>
        <TextInput
          value={aiInput}
          onChangeText={handleAiInputChange}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
          placeholder="例: 田中 10/25 10時から17時まで ホール担当"
        />
      </View>

      <Button 
        mode="contained" 
        onPress={handleSubmit} 
        loading={loading} 
        disabled={loading}
        style={styles.submitButton}
        labelStyle={styles.submitButtonLabel}
      >
        シフトを登録
      </Button>
    </ScrollView>
  );
};

// --- 在庫入力フォーム ---
type InventoryFormData = Pick<InventoryItem, 'item_name' | 'notes'>;
const InventoryForm: React.FC = () => {
  const [formData, setFormData] = useState<InventoryFormData>({ item_name: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.item_name) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '商品名は必須です。',
      });
      return;
    }
    setLoading(true);
    try {
      await inventoryAPI.create(formData as InventoryItem);
      Toast.show({
        type: 'success',
        text1: '成功',
        text2: '在庫品目を登録しました。',
      });
      setFormData({ item_name: '', notes: '' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '在庫品目の登録に失敗しました。',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <TextInput
        label="商品名 *"
        value={formData.item_name}
        onChangeText={(text) => handleChange('item_name', text)}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Info"
        value={formData.notes}
        onChangeText={(text) => handleChange('notes', text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
      />
      <Button 
        mode="contained" 
        onPress={handleSubmit} 
        loading={loading} 
        disabled={loading}
        style={styles.submitButton}
        labelStyle={styles.submitButtonLabel}
      >
        在庫品目を登録
      </Button>
    </ScrollView>
  );
};

// --- お知らせ入力フォーム ---
type NoticeFormData = Omit<Notice, 'id' | 'is_read' | 'created_at' | 'updated_at' | 'priority'>;
const NoticeForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<NoticeFormData>>({ title: '', content: '', author: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: 'タイトルと内容は必須です。',
      });
      return;
    }
    setLoading(true);
    try {
      await noticeAPI.create(formData as Notice);
      Toast.show({
        type: 'success',
        text1: '成功',
        text2: 'お知らせを登録しました。',
      });
      setFormData({ title: '', content: '', author: '' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: 'お知らせの登録に失敗しました。',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <TextInput
        label="タイトル *"
        value={formData.title}
        onChangeText={(text) => handleChange('title', text)}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="内容 *"
        value={formData.content}
        onChangeText={(text) => handleChange('content', text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
      />
      <TextInput
        label="作成者"
        value={formData.author}
        onChangeText={(text) => handleChange('author', text)}
        style={styles.input}
        mode="outlined"
      />
      <Button 
        mode="contained" 
        onPress={handleSubmit} 
        loading={loading} 
        disabled={loading}
        style={styles.submitButton}
        labelStyle={styles.submitButtonLabel}
      >
        お知らせを登録
      </Button>
    </ScrollView>
  );
};

// --- メイン入力画面 ---
type InputTab = 'shift' | 'inventory' | 'notice';

const InputScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InputTab>('shift');

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="入力・編集" titleStyle={styles.appBarTitle} />
      </Appbar.Header>

      <View style={styles.segmentedButtonsContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as InputTab)}
          buttons={[
            { value: 'shift', label: 'シフト' },
            { value: 'inventory', label: '在庫' },
            { value: 'notice', label: 'お知らせ' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView style={styles.contentContainer}>
        {activeTab === 'shift' && <ShiftForm />}
        {activeTab === 'inventory' && <InventoryForm />}
        {activeTab === 'notice' && <NoticeForm />}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  appBarHeader: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowOpacity: 0.1,
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  segmentedButtonsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  segmentedButtons: {
    height: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    paddingBottom: 20,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  aiInputSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  aiInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default InputScreen;