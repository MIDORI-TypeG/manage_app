import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, Edit, Cookie, Coffee, ClipboardList } from 'lucide-react';
import Noticeboard from './Noticeboard.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/shifts', label: 'シフト', icon: Calendar },
  { path: '/inventory/sweets', label: 'スイーツ', icon: Cookie },
  { path: '/inventory/beans', label: '焙煎豆', icon: Coffee },
  { path: '/inventory/supplies', label: '備品', icon: ClipboardList },
  { path: '/input', label: '入力', icon: Edit },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const showNoticeboard = location.pathname !== '/input';

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
          <span>管理アプリ</span>
        </div>
        <nav className="flex-1 px-2 py-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 my-1 rounded-md transition-colors duration-200 ${isActive
                      ? 'bg-gray-700'
                      : 'hover:bg-gray-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {showNoticeboard && <Noticeboard />}
        {children}
      </main>
    </div>
  );
};

export default Layout;
