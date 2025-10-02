import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Package, 
  Bell, 
  Edit3, 
  Menu, 
  X,
  AlertCircle
} from 'lucide-react';
import { noticeAPI, inventoryAPI } from '../services/api.ts';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // 未読お知らせ数を取得
    const fetchUnreadCount = async () => {
      try {
        const count = await noticeAPI.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('未読お知らせ数の取得に失敗しました:', error);
      }
    };

    // 在庫不足アラート数を取得
    const fetchLowStockCount = async () => {
      try {
        const alerts = await inventoryAPI.getAlerts();
        setLowStockCount(alerts.length);
      } catch (error) {
        console.error('在庫アラート数の取得に失敗しました:', error);
      }
    };

    fetchUnreadCount();
    fetchLowStockCount();

    // 5分ごとに更新
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchLowStockCount();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const navigation = [
    {
      name: 'シフト管理',
      href: '/shifts',
      icon: Calendar,
      current: location.pathname === '/' || location.pathname === '/shifts',
    },
    {
      name: '在庫管理',
      href: '/inventory',
      icon: Package,
      current: location.pathname === '/inventory',
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      name: 'お知らせ',
      href: '/notices',
      icon: Bell,
      current: location.pathname === '/notices',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: '入力・編集',
      href: '/input',
      icon: Edit3,
      current: location.pathname === '/input',
    },
  ];

  const getCurrentPageTitle = () => {
    const current = navigation.find(item => item.current);
    return current?.name || 'シフト・在庫管理システム';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* モバイル用サイドバー */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transition ease-in-out duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-lg font-semibold text-gray-900">管理システム</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md relative`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* デスクトップ用サイドバー */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">管理システム</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        item.current
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md relative`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* ページヘッダー */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">
                {getCurrentPageTitle()}
              </h1>
              <div className="flex items-center space-x-4">
                {/* アラート表示 */}
                {lowStockCount > 0 && (
                  <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    在庫不足: {lowStockCount}件
                  </div>
                )}
                {unreadCount > 0 && (
                  <div className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                    <Bell className="h-4 w-4 mr-1" />
                    未読: {unreadCount}件
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
