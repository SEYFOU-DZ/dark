'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Users, 
  LogOut,
  Menu,
  X,
  Languages
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  locale: string;
  onLocaleChange: (locale: string) => void;
}

export default function Sidebar({ activeTab, onTabChange, locale, onLocaleChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const user = getUser();
  const isAdmin = user?.isAdmin;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
      requests: { en: 'Requests', ar: 'الطلبات' },
      invoices: { en: 'Invoices', ar: 'الفواتير' },
      users: { en: 'Users', ar: 'المستخدمين' },
      logout: { en: 'Logout', ar: 'تسجيل الخروج' },
      admin: { en: 'Admin', ar: 'مشرف' },
      user: { en: 'User', ar: 'مستخدم' },
    };
    return translations[key]?.[locale] || key;
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'requests', icon: FileText },
    { id: 'invoices', icon: Receipt },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'users', icon: Users });
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-slate-900 rounded-lg text-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 right-0 z-40
        w-64 bg-gradient-to-b from-slate-900 to-slate-800
        border-l border-slate-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <img src="/ttty.png" alt="Logo" className="h-12 w-auto" />
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-xs text-slate-400">
                  {isAdmin ? t('admin') : t('user')}
                </p>
              </div>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="p-4 border-b border-slate-700">
            <button
              onClick={() => onLocaleChange(locale === 'en' ? 'ar' : 'en')}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg
                text-slate-300 hover:bg-slate-700 hover:text-white
                transition-all duration-200"
            >
              <Languages size={20} />
              <span className="font-medium">{locale === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{t(item.id)}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                text-red-400 hover:bg-red-600/20 hover:text-red-300
                transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}