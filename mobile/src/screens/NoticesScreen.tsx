import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Appbar, Card, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { noticeAPI } from '../services/api';
import { Notice } from '../types';
import { format } from 'date-fns';

const NoticesScreen: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await noticeAPI.getAll();
      setNotices(data);
    } catch (err) {
      setError('お知らせの読み込みに失敗しました。');
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: 'お知らせの読み込みに失敗しました。',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
    const intervalId = setInterval(fetchNotices, 60000); // 1分ごとに更新
    return () => clearInterval(intervalId);
  }, [fetchNotices]);

  const handleToggleRead = async (notice: Notice) => {
    const newReadStatus = !notice.is_read;
    setNotices((prevNotices) =>
      prevNotices.map((n) =>
        n.id === notice.id ? { ...n, is_read: newReadStatus } : n
      )
    );
    try {
      await noticeAPI.markAsRead(notice.id, newReadStatus);
      Toast.show({
        type: 'success',
        text1: '成功',
        text2: `お知らせを「${newReadStatus ? '既読' : '未読'}」にしました`,
      });
    } catch (err) {
      setNotices((prevNotices) =>
        prevNotices.map((n) =>
          n.id === notice.id ? { ...n, is_read: !newReadStatus } : n
        )
      );
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '既読状態の更新に失敗しました。',
      });
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotices = notices.filter((n) => !n.is_read);
    if (unreadNotices.length === 0) {
      Toast.show({
        type: 'info',
        text1: '情報',
        text2: 'すべてのお知らせは既に既読です',
      });
      return;
    }

    const originalNotices = [...notices];
    setNotices((prevNotices) => prevNotices.map((n) => ({ ...n, is_read: true })));
    try {
      await noticeAPI.markAllAsRead();
      Toast.show({
        type: 'success',
        text1: '成功',
        text2: 'すべてのお知らせを既読にしました',
      });
    } catch (err) {
      setNotices(originalNotices);
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '全件既読処理に失敗しました。',
      });
    }
  };

  const handleDelete = async (noticeId: number) => {
    const noticeToDelete = notices.find((n) => n.id === noticeId);
    if (!noticeToDelete || !noticeToDelete.is_read) {
      Toast.show({
        type: 'info',
        text1: '情報',
        text2: '既読のお知らせのみ削除できます。',
      });
      return;
    }

    Alert.alert(
      'お知らせ削除',
      'このお知らせを本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          onPress: async () => {
            const originalNotices = [...notices];
            setNotices(notices.filter((n) => n.id !== noticeId));
            try {
              await noticeAPI.delete(noticeId);
              Toast.show({
                type: 'success',
                text1: '成功',
                text2: 'お知らせを削除しました。',
              });
            } catch (err) {
              setNotices(originalNotices);
              Toast.show({
                type: 'error',
                text1: 'エラー',
                text2: 'お知らせの削除に失敗しました。',
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>お知らせを読み込み中...</Text>
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
    <View style={styles.container}>
      <Appbar.Header style={styles.appBarHeader}>
        <Appbar.Content title="お知らせ" titleStyle={styles.appBarTitle} />
        <Appbar.Action 
          icon="check-all" 
          onPress={handleMarkAllRead} 
          color="#3b82f6" 
          disabled={loading || notices.every(n => n.is_read)}
        />
      </Appbar.Header>

      <ScrollView style={styles.scrollViewContent}>
        {notices.length > 0 ? (
          notices.map((notice) => (
            <Card 
              key={notice.id} 
              style={[styles.card, notice.is_read ? styles.cardRead : styles.cardUnread]}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, notice.is_read ? styles.textRead : styles.textUnread]}>
                    {notice.title}
                  </Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => handleToggleRead(notice)}
                      disabled={loading}
                      style={[styles.actionButton, notice.is_read ? styles.buttonRead : styles.buttonUnread]}
                    >
                      <MaterialCommunityIcons 
                        name={notice.is_read ? "eye-off-outline" : "eye-outline"} 
                        size={18} 
                        color={notice.is_read ? "#64748b" : "#3b82f6"} 
                      />
                      <Text style={[styles.actionButtonText, notice.is_read ? styles.textRead : styles.textUnread]}>
                        {notice.is_read ? '未読にする' : '既読にする'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(notice.id)}
                      disabled={loading || !notice.is_read}
                      style={[styles.actionButton, styles.buttonDelete, (loading || !notice.is_read) && styles.buttonDisabled]}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={18} color="#ef4444" />
                      <Text style={[styles.actionButtonText, styles.textDelete]}>削除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.cardContent, notice.is_read ? styles.textRead : styles.textUnread]}>
                  {notice.content}
                </Text>
                <Text style={[styles.cardDate, notice.is_read ? styles.textRead : styles.textUnread]}>
                  {notice.author && `${notice.author} • `}{format(new Date(notice.created_at), 'yyyy/MM/dd HH:mm')}
                </Text>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={styles.noNoticesText}>新しいお知らせはありません。</Text>
        )}
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
  scrollViewContent: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  cardRead: {
    backgroundColor: '#f1f5f9',
    opacity: 0.8,
  },
  cardUnread: {
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 1,
    paddingRight: 10,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  buttonRead: {
    backgroundColor: '#e2e8f0',
  },
  buttonUnread: {
    backgroundColor: '#e0f2fe',
  },
  buttonDelete: {
    backgroundColor: '#fee2e2',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cardContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  textRead: {
    color: '#64748b',
  },
  textUnread: {
    color: '#1e293b',
  },
  noNoticesText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
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
});

export default NoticesScreen;