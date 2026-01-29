import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { provider } from './core/provider';
import { User } from './types';
import Layout from './components/Layout';
import { AdminDashboard } from './admin/AdminDashboard';
import { StudentsManager } from './admin/StudentsManager';
import { ClassesManager } from './admin/ClassesManager';
import { ParentsManager } from './admin/ParentsManager';
import { AttendanceManager } from './admin/AttendanceManager';
import { BehaviorManager } from './admin/BehaviorManager';
import { AnnouncementsManager } from './admin/AnnouncementsManager';
import { DocumentsManager } from './admin/DocumentsManager';
import { TasksManager } from './admin/TasksManager';
import { MessagesManager } from './admin/MessagesManager';
import { ReportsDashboard } from './admin/ReportsDashboard';
import { QuestionBankManager } from './admin/QuestionBankManager'; 
import { AppDashboard } from './app/AppDashboard';
import { AttendanceHistory } from './app/AttendanceHistory';
import { BehaviorHistory } from './app/BehaviorHistory';
import { AnnouncementsFeed } from './app/AnnouncementsFeed';
import { DocumentsLibrary } from './app/DocumentsLibrary';
import { TasksList } from './app/TasksList';
import { MessagesApp } from './app/MessagesApp';
import { LevelGame } from './app/LevelGame'; 
import { HonorBoard } from './app/HonorBoard';
import { AIAssistant } from './app/AIAssistant';
import { StudentProfile } from './app/StudentProfile';
import { LanguageProvider, useLanguage } from './core/i18n';
import { Icon } from './components/Icons';

// Auth Page Component
const AuthPage = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'admin' | 'student' | 'parent'>('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { t, toggleLanguage, language } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await provider.auth.register({ username, password, fullName, role });
                alert(t('auth.success'));
                setIsRegister(false);
            } else {
                const user = await provider.auth.login(username, password);
                if (user) {
                    // Simple auth state management via localStorage for demo
                    localStorage.setItem('mrs_hien_user', JSON.stringify(user));
                    navigate(user.role === 'admin' ? '/admin' : '/app');
                } else {
                    setError('Tên đăng nhập hoặc mật khẩu không đúng.'); // Keep error msg simple or translate later
                }
            }
        } catch (err: any) {
            setError(err.message || t('auth.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-5xl w-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
                {/* Language Switcher - Absolute */}
                <div className="absolute top-4 right-4 z-10">
                    <button 
                       onClick={toggleLanguage}
                       className="flex items-center justify-center px-3 py-1 bg-white/80 backdrop-blur rounded-full shadow text-xs font-bold text-gray-600 hover:text-emerald-600 border border-gray-200"
                    >
                        {language === 'vi' ? '🇻🇳 VN' : '🇬🇧 EN'}
                    </button>
                </div>

                {/* Left Panel: Branding */}
                <div className="w-full md:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-6">
                            <Icon name="book" size={32} className="text-white" />
                            <span className="text-2xl font-bold uppercase tracking-wide">LMS EDU</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-4 leading-tight">
                            Hệ sinh thái số<br/>
                            <span className="text-yellow-300">SmartClass</span>
                        </h1>
                        <p className="text-emerald-100 text-sm leading-relaxed mb-8">
                            Nền tảng quản trị lớp học thông minh và cá nhân hóa học tập ngoại ngữ ứng dụng Trí tuệ nhân tạo (AI).
                        </p>
                    </div>

                    <div className="relative z-10">
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 inline-block w-full">
                             <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1">TRẠNG THÁI KẾT NỐI</h3>
                             <div className="flex items-center text-sm font-medium">
                                 <span className="w-2.5 h-2.5 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                 Hệ thống đang hoạt động ổn định
                             </div>
                        </div>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="absolute top-20 right-[-50px] w-60 h-60 bg-emerald-400 opacity-20 rounded-full blur-3xl"></div>
                </div>

                {/* Right Panel: Login Form */}
                <div className="w-full md:w-1/2 p-10 md:p-14 bg-white flex flex-col justify-center">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {isRegister ? t('auth.register') : t('auth.login')}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            {isRegister ? 'Tạo tài khoản mới để bắt đầu' : 'Nhập thông tin tài khoản của bạn để truy cập'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-600 text-sm rounded flex items-center">
                            <Icon name="alert" size={16} className="mr-2" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isRegister && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">{t('auth.fullname')}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Icon name="user" size={18} className="text-gray-400" />
                                        </div>
                                        <input 
                                            type="text" 
                                            required 
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition text-sm"
                                            placeholder="Nguyễn Văn A"
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">{t('auth.role')}</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition text-sm"
                                        value={role}
                                        onChange={e => setRole(e.target.value as any)}
                                    >
                                        <option value="student">{t('auth.role.student')}</option>
                                        <option value="parent">{t('auth.role.parent')}</option>
                                        <option value="admin">{t('auth.role.admin')}</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Tên đăng nhập (Username)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icon name="user" size={18} className="text-gray-400" />
                                </div>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition text-sm"
                                    placeholder="VD: an.nv"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Mật khẩu (Password)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icon name="lock" size={18} className="text-gray-400" />
                                </div>
                                <input 
                                    type="password" 
                                    required 
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition text-sm"
                                    placeholder="........"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 shadow-md flex justify-center items-center"
                        >
                            {loading ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Đang xử lý</>
                            ) : (
                                <><Icon name="logOut" className="mr-2 rotate-180" size={18} /> {isRegister ? t('auth.register_submit') : t('auth.submit')}</>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
                        <span>{isRegister ? t('auth.have_account') : t('auth.no_account')}</span>
                        <button 
                            onClick={() => setIsRegister(!isRegister)} 
                            className="text-emerald-600 font-bold hover:underline"
                        >
                            {isRegister ? '+ ' + t('auth.login_now') : '+ ' + t('auth.register_now')}
                        </button>
                    </div>

                    {!isRegister && (
                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest font-bold">Tài khoản trải nghiệm:</p>
                            <div className="flex justify-center gap-2 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded border border-gray-100 inline-block">
                                <span>Admin: admin / 123</span>
                                <span className="text-gray-300">|</span>
                                <span>HS: hs / 123</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Info */}
            <div className="mt-8 text-center bg-white py-3 px-6 rounded-full shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">Thiết kế & Phát triển bởi: <strong className="text-emerald-600">Hien Dao</strong></span>
                <div className="h-4 w-px bg-gray-300 hidden md:block"></div>
                <div className="flex space-x-3">
                    <a href="tel:0975641424" className="flex items-center hover:text-blue-600 transition bg-gray-100 px-3 py-1 rounded-full text-xs">
                        <Icon name="phone" size={14} className="mr-1.5" /> Zalo: 0975641424
                    </a>
                    <a href="https://www.facebook.com/hien.dao.144/" target="_blank" rel="noreferrer" className="flex items-center hover:text-blue-800 transition bg-blue-50 px-3 py-1 rounded-full text-xs text-blue-700">
                        <Icon name="facebook" size={14} className="mr-1.5" /> Facebook
                    </a>
                    <a href="https://mytambn.violet.vn/" target="_blank" rel="noreferrer" className="flex items-center hover:text-red-600 transition bg-red-50 px-3 py-1 rounded-full text-xs text-red-600">
                        <Icon name="globe" size={14} className="mr-1.5" /> Website
                    </a>
                </div>
            </div>
        </div>
    );
};

// Admin Routes Wrapper
const AdminRoutes = () => {
  return (
    <Layout role="admin">
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/announcements" element={<AnnouncementsManager />} />
        <Route path="/classes" element={<ClassesManager />} />
        <Route path="/students" element={<StudentsManager />} />
        <Route path="/parents" element={<ParentsManager />} />
        <Route path="/attendance" element={<AttendanceManager />} />
        <Route path="/behavior" element={<BehaviorManager />} />
        <Route path="/documents" element={<DocumentsManager />} />
        <Route path="/tasks" element={<TasksManager />} />
        <Route path="/messages" element={<MessagesManager />} />
        <Route path="/reports" element={<ReportsDashboard />} />
        <Route path="/questions" element={<QuestionBankManager />} />
        <Route path="/honor" element={<HonorBoard />} />
      </Routes>
    </Layout>
  );
};

// App (Student/Parent) Routes Wrapper
const AppRoutes = () => {
  return (
    <Layout role="app">
      <Routes>
        <Route path="/" element={<AppDashboard />} />
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/announcements" element={<AnnouncementsFeed />} />
        <Route path="/attendance" element={<AttendanceHistory />} />
        <Route path="/behavior" element={<BehaviorHistory />} />
        <Route path="/tasks" element={<TasksList />} />
        <Route path="/documents" element={<DocumentsLibrary />} />
        <Route path="/messages" element={<MessagesApp />} />
        <Route path="/game" element={<LevelGame />} />
        <Route path="/honor" element={<HonorBoard />} />
      </Routes>
    </Layout>
  );
};

export default function App() {
  // Initialize seed data on mount
  useEffect(() => {
    provider.seedData();
  }, []);

  return (
    <LanguageProvider>
        <HashRouter>
        <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="/app/*" element={<AppRoutes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </HashRouter>
    </LanguageProvider>
  );
}