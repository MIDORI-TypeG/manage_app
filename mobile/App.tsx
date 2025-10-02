import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// スクリーン
import ShiftsScreen from './src/screens/ShiftsScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import NoticesScreen from './src/screens/NoticesScreen';
import InputScreen from './src/screens/InputScreen';

// 型定義
import { BottomTabParamList } from './src/types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

// カスタムテーマ
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3b82f6',
    primaryContainer: '#dbeafe',
    secondary: '#64748b',
    surface: '#ffffff',
    background: '#f8fafc',
    error: '#ef4444',
    onSurface: '#1e293b',
    onBackground: '#1e293b',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: string;

                switch (route.name) {
                  case 'Shifts':
                    iconName = 'calendar-today';
                    break;
                  case 'Inventory':
                    iconName = 'inventory';
                    break;
                  case 'Notices':
                    iconName = 'notifications';
                    break;
                  case 'Input':
                    iconName = 'edit';
                    break;
                  default:
                    iconName = 'help';
                    break;
                }

                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                backgroundColor: theme.colors.surface,
                borderTopWidth: 1,
                borderTopColor: '#e5e7eb',
              },
              headerStyle: {
                backgroundColor: theme.colors.surface,
                elevation: 2,
                shadowOpacity: 0.1,
              },
              headerTitleStyle: {
                fontWeight: '600',
                fontSize: 18,
              },
              headerTintColor: theme.colors.onSurface,
            })}
          >
            <Tab.Screen 
              name="Shifts" 
              component={ShiftsScreen} 
              options={{ 
                title: 'シフト管理',
                headerTitle: 'シフト管理'
              }} 
            />
            <Tab.Screen 
              name="Inventory" 
              component={InventoryScreen} 
              options={{ 
                title: '在庫管理',
                headerTitle: '在庫管理'
              }} 
            />
            <Tab.Screen 
              name="Notices" 
              component={NoticesScreen} 
              options={{ 
                title: 'お知らせ',
                headerTitle: 'お知らせ'
              }} 
            />
            <Tab.Screen 
              name="Input" 
              component={InputScreen} 
              options={{ 
                title: '入力・編集',
                headerTitle: '入力・編集'
              }} 
            />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="dark" />
        <Toast />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
