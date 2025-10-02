import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Appbar, DataTable, SegmentedButtons } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { inventoryAPI } from '../services/api';
import { InventoryItem } from '../types';

type InventoryCategory = 'sweets' | 'beans' | 'supplies';

const InventoryScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory>('sweets');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let categoryParam: string | undefined;
      switch (selectedCategory) {
        case 'sweets':
          categoryParam = 'スイーツ';
          break;
        case 'beans':
          categoryParam = '焙煎豆';
          break;
        case 'supplies':
          categoryParam = 'その他';
          break;
      }
      const data = await inventoryAPI.getAll({ category: categoryParam });
      setItems(data);
    } catch (err) {
      setError('在庫情報の読み込みに失敗しました。');
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '在庫情報の読み込みに失敗しました。',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (itemToDelete: InventoryItem) => {
    Alert.alert(
      'アイテム削除',
      `「${itemToDelete.item_name}」を本当に削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          onPress: async () => {
            const originalItems = [...items];
            setItems(items.filter((item) => item.id !== itemToDelete.id));
            try {
              await inventoryAPI.delete(itemToDelete.id);
              Toast.show({
                type: 'success',
                text1: '成功',
                text2: 'アイテムを削除しました。',
              });
            } catch (err) {
              setItems(originalItems);
              Toast.show({
                type: 'error',
                text1: 'エラー',
                text2: 'アイテムの削除に失敗しました。',
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleStatusChange = async (itemToUpdate: InventoryItem) => {
    const newStatus = itemToUpdate.status === '在庫有' ? '要発注' : '在庫有';

    // Optimistic UI update
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemToUpdate.id ? { ...item, status: newStatus } : item
      )
    );

    try {
      await inventoryAPI.updateStatus(itemToUpdate.id, newStatus);
      Toast.show({
        type: 'success',
        text1: '成功',
        text2: 'ステータスを更新しました。',
      });
    } catch (err) {
      // Revert on error
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemToUpdate.id ? { ...item, status: itemToUpdate.status } : item
        )
      );
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: 'ステータスの更新に失敗しました。',
      });
    }
  };

  const getColumnVisibility = useMemo(() => {
    const base = {
      showCategory: true,
      showCurrentStock: true,
      showMinStock: true,
      showUnit: true,
      showInfo: false,
      showStatus: true,
      showDelete: true,
    };
    switch (selectedCategory) {
      case 'sweets':
      case 'beans':
        return { ...base, showCategory: false, showMinStock: false, showUnit: false, showInfo: false };
      case 'supplies':
        return { ...base, showCategory: false, showCurrentStock: false, showMinStock: false, showUnit: false, showInfo: true };
      default:
        return base;
    }
  }, [selectedCategory]);

  const renderStatusCell = (item: InventoryItem) => {
    const isSupplies = selectedCategory === 'supplies';
    const statusText = item.status;
    const statusColor = statusText === '要発注' ? '#ef4444' : '#22c55e';
    const statusBgColor = statusText === '要発注' ? '#fee2e2' : '#dcfce7';

    return (
      <TouchableOpacity
        onPress={isSupplies ? () => handleStatusChange(item) : undefined}
        style={[ 
          styles.statusBadge,
          { backgroundColor: statusBgColor },
          isSupplies && styles.statusBadgeClickable,
        ]}
        disabled={!isSupplies}
      >
        {statusText === '要発注' && (
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={statusColor} style={styles.statusIcon} />
        )}
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </TouchableOpacity>
    );
  };

  const renderInfoCell = (item: InventoryItem) => {
    const isUrl = item.notes && (item.notes.startsWith('http://') || item.notes.startsWith('https://'));
    if (isUrl) {
      return (
        <TouchableOpacity 
          onPress={() => Alert.alert('URLを開く', `このURLを開きますか？\n${item.notes}`, [
            { text: 'キャンセル', style: 'cancel' },
            { text: '開く', onPress: () => console.log('Open URL:', item.notes) } // TODO: Implement actual URL opening
          ])}
        >
          <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="tail">{item.notes}</Text>
        </TouchableOpacity>
      );
    }
    return <Text numberOfLines={1} ellipsizeMode="tail">{item.notes || '-'}</Text>;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>在庫情報を読み込み中...</Text>
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
        <Appbar.Content title="在庫管理" titleStyle={styles.appBarTitle} />
      </Appbar.Header>

      <View style={styles.segmentedButtonsContainer}>
        <SegmentedButtons
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value as InventoryCategory)}
          buttons={[
            { value: 'sweets', label: 'スイーツ' },
            { value: 'beans', label: '焙煎豆' },
            { value: 'supplies', label: '備品' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView style={styles.dataTableContainer}>
        <DataTable>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title textStyle={styles.tableHeaderText}>商品名</DataTable.Title>
            {getColumnVisibility.showCategory && <DataTable.Title textStyle={styles.tableHeaderText}>カテゴリ</DataTable.Title>}
            {getColumnVisibility.showCurrentStock && <DataTable.Title numeric textStyle={styles.tableHeaderText}>現在庫</DataTable.Title>}
            {getColumnVisibility.showMinStock && <DataTable.Title numeric textStyle={styles.tableHeaderText}>最小在庫</DataTable.Title>}
            {getColumnVisibility.showUnit && <DataTable.Title textStyle={styles.tableHeaderText}>単位</DataTable.Title>}
            {getColumnVisibility.showInfo && <DataTable.Title textStyle={styles.tableHeaderText}>Info</DataTable.Title>}
            {getColumnVisibility.showStatus && <DataTable.Title textStyle={styles.tableHeaderText}>状況</DataTable.Title>}
            {getColumnVisibility.showDelete && <DataTable.Title textStyle={styles.tableHeaderText}></DataTable.Title>}
          </DataTable.Header>

          {items.length > 0 ? (
            items.map((item) => (
              <DataTable.Row key={item.id} style={item.status === '要発注' ? styles.rowLowStock : {}}>
                <DataTable.Cell textStyle={styles.tableCellText}>{item.item_name}</DataTable.Cell>
                {getColumnVisibility.showCategory && <DataTable.Cell textStyle={styles.tableCellText}>{item.category || '-'}</DataTable.Cell>}
                {getColumnVisibility.showCurrentStock && <DataTable.Cell numeric textStyle={styles.tableCellText}>{item.current_stock}</DataTable.Cell>}
                {getColumnVisibility.showMinStock && <DataTable.Cell numeric textStyle={styles.tableCellText}>{item.minimum_stock}</DataTable.Cell>}
                {getColumnVisibility.showUnit && <DataTable.Cell textStyle={styles.tableCellText}>{item.unit}</DataTable.Cell>}
                {getColumnVisibility.showInfo && <DataTable.Cell textStyle={styles.tableCellText}>{renderInfoCell(item)}</DataTable.Cell>}
                {getColumnVisibility.showStatus && <DataTable.Cell textStyle={styles.tableCellText}>{renderStatusCell(item)}</DataTable.Cell>}
                {getColumnVisibility.showDelete && (
                  <DataTable.Cell style={styles.deleteCell}>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
                      <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </DataTable.Cell>
                )}
              </DataTable.Row>
            ))
          ) : (
            <View style={styles.noItemsContainer}>
              <Text style={styles.noItemsText}>該当する在庫品目はありません。</Text>
            </View>
          )}
        </DataTable>
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
  dataTableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#334155',
  },
  tableCellText: {
    fontSize: 14,
    color: '#334155',
  },
  rowLowStock: {
    backgroundColor: '#fef2f2',
  },
  noItemsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 16,
    color: '#64748b',
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
  deleteCell: {
    justifyContent: 'flex-end',
  },
  deleteButton: {
    padding: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeClickable: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  urlText: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});

export default InventoryScreen;