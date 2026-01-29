import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icons';
import { useLanguage } from '../core/i18n';

interface LayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'app';
}

const Layout: React.FC<LayoutProps> = ({ children, role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, toggleLanguage } = useLanguage();

  const adminLinks = [
    { label: t('menu.dashboard'), path: '/admin', icon: 'dashboard' },
    { label: t('menu.announcements'), path: '/admin/announcements', icon: 'bell' },
    { label: t('menu.honorBoard'), path: '/admin/honor', icon: 'trophy' },
    { label: t('menu.classes'), path: '/admin/classes', icon: 'book' },
    { label: t('menu.students'), path: '/admin/students', icon: 'users' },
    { label: t('menu.parents'), path: '/admin/parents', icon: 'users' },
    { label: t('menu.tasks'), path: '/admin/tasks', icon: 'book' },
    { label: t('menu.questions'), path: '/admin/questions', icon: 'gamepad' }, // Changed icon to gamepad
    { label: t('menu.documents'), path: '/admin/documents', icon: 'file' },
    { label: t('menu.attendance'), path: '/admin/attendance', icon: 'check' },
    { label: t('menu.behavior'), path: '/admin/behavior', icon: 'star' },
    { label: t('menu.messages'), path: '/admin/messages', icon: 'message' },
    { label: t('menu.reports'), path: '/admin/reports', icon: 'chart' },
  ];

  const appLinks = [
    { label: t('menu.profile'), path: '/app/profile', icon: 'user' }, // Moved Profile to top or prominent position
    { label: t('menu.home'), path: '/app', icon: 'home' },
    { label: t('menu.announcements'), path: '/app/announcements', icon: 'bell' },
    { label: t('menu.honorBoard'), path: '/app/honor', icon: 'trophy' },
    { label: t('menu.tasks'), path: '/app/tasks', icon: 'book' },
    { label: t('menu.documents'), path: '/app/documents', icon: 'file' },
    { label: t('menu.game'), path: '/app/game', icon: 'gamepad' },
    { label: t('menu.ai_assistant'), path: '/app/ai-assistant', icon: 'bot' },
    { label: t('menu.attendance'), path: '/app/attendance', icon: 'calendar' },
    { label: t('menu.behavior'), path: '/app/behavior', icon: 'star' },
    { label: t('menu.messages'), path: '/app/messages', icon: 'message' },
    // Removed Reports
  ];

  const links = role === 'admin' ? adminLinks : appLinks;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-emerald-800 text-white shadow-lg">
        <div className="p-6 border-b border-emerald-700">
          <h1 className="text-xl font-bold tracking-tight">SmartClass</h1>
          <span className="text-xs text-emerald-200 uppercase tracking-widest">
            {role === 'admin' ? t('menu.teacherPortal') : t('menu.studentPortal')}
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                location.pathname === link.path
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-emerald-100 hover:bg-emerald-700'
              }`}
            >
              <Icon name={link.icon} className="mr-3" />
              {link.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-emerald-700">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center px-4 py-2 text-sm text-emerald-200 hover:text-white w-full"
          >
            <Icon name="logOut" size={16} className="mr-2" />
            {t('menu.logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-10">
          <div className="flex items-center">
            <button
              className="md:hidden mr-4 text-gray-600"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Icon name="menu" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {links.find(l => l.path === location.pathname)?.label || 'SmartClass'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
             {/* Language Switcher */}
             <button 
                onClick={toggleLanguage}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                title="Switch Language"
             >
                 {language === 'vi' ? 'VN' : 'EN'}
             </button>

            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
               {role === 'admin' ? 'A' : 'S'}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 w-64 bg-emerald-800 text-white shadow-xl transform transition-transform duration-300">
               <div className="p-6 border-b border-emerald-700 flex justify-between">
                <span className="font-bold">Menu</span>
                <button onClick={() => setSidebarOpen(false)}>&times;</button>
               </div>
               <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-100px)]">
                {links.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => {
                      navigate(link.path);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-lg ${
                      location.pathname === link.path ? 'bg-emerald-600' : 'hover:bg-emerald-700'
                    }`}
                  >
                    <Icon name={link.icon} className="mr-3" />
                    {link.label}
                  </button>
                ))}
                 <button 
                    onClick={() => navigate('/')}
                    className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-emerald-700 mt-4 text-emerald-200"
                  >
                    <Icon name="logOut" className="mr-3" />
                    {t('menu.exit')}
                  </button>
               </nav>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;