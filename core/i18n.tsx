import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'vi' | 'en';

const translations = {
  vi: {
    // Menu
    'menu.dashboard': 'Tổng quan',
    'menu.announcements': 'Thông báo',
    'menu.honorBoard': 'Bảng vàng',
    'menu.classes': 'Lớp học',
    'menu.students': 'Học sinh',
    'menu.parents': 'Phụ huynh',
    'menu.tasks': 'Bài tập',
    'menu.questions': 'Game', 
    'menu.documents': 'Tài liệu',
    'menu.attendance': 'Điểm danh',
    'menu.behavior': 'Nề nếp',
    'menu.messages': 'Tin nhắn',
    'menu.reports': 'Báo cáo',
    'menu.profile': 'Hồ sơ & Thành tích', // New Item
    'menu.game': 'Game',
    'menu.home': 'Góc học tập',
    'menu.logout': 'Đổi vai trò',
    'menu.exit': 'Thoát',
    'menu.teacherPortal': 'Cổng Giáo Viên',
    'menu.studentPortal': 'Cổng Học Sinh',
    'menu.ai_assistant': 'Trợ lý AI',

    // Auth
    'auth.login': 'Đăng nhập',
    'auth.register': 'Đăng ký',
    'auth.username': 'Tên đăng nhập',
    'auth.password': 'Mật khẩu',
    'auth.fullname': 'Họ và tên',
    'auth.role': 'Vai trò',
    'auth.role.student': 'Học sinh',
    'auth.role.parent': 'Phụ huynh',
    'auth.role.admin': 'Giáo viên (Admin)',
    'auth.submit': 'Đăng nhập',
    'auth.register_submit': 'Đăng ký',
    'auth.have_account': 'Đã có tài khoản?',
    'auth.no_account': 'Chưa có tài khoản?',
    'auth.login_now': 'Đăng nhập ngay',
    'auth.register_now': 'Đăng ký ngay',
    'auth.processing': 'Đang xử lý...',
    'auth.error': 'Có lỗi xảy ra',
    'auth.success': 'Đăng ký thành công! Vui lòng đăng nhập.',
    
    // Common
    'common.search': 'Tìm kiếm...',
    'common.add': 'Thêm mới',
    'common.edit': 'Sửa',
    'common.delete': 'Xóa',
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.download_template': 'Tải mẫu',
    'common.import_excel': 'Nhập Excel',
    'common.loading': 'Đang tải...',
    'common.status': 'Trạng thái',
    'common.actions': 'Thao tác',
  },
  en: {
    // Menu
    'menu.dashboard': 'Dashboard',
    'menu.announcements': 'Announcements',
    'menu.honorBoard': 'Honor Board',
    'menu.classes': 'Classes',
    'menu.students': 'Students',
    'menu.parents': 'Parents',
    'menu.tasks': 'Tasks & Homework',
    'menu.questions': 'Game Manager',
    'menu.documents': 'Documents',
    'menu.attendance': 'Attendance',
    'menu.behavior': 'Behavior',
    'menu.messages': 'Messages',
    'menu.reports': 'Reports',
    'menu.profile': 'Profile & Achievements', // New Item
    'menu.game': 'Game',
    'menu.home': 'Study Corner',
    'menu.logout': 'Switch Role',
    'menu.exit': 'Logout',
    'menu.teacherPortal': 'Teacher Portal',
    'menu.studentPortal': 'Student Portal',
    'menu.ai_assistant': 'AI Assistant',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.fullname': 'Full Name',
    'auth.role': 'Role',
    'auth.role.student': 'Student',
    'auth.role.parent': 'Parent',
    'auth.role.admin': 'Teacher (Admin)',
    'auth.submit': 'Login',
    'auth.register_submit': 'Register',
    'auth.have_account': 'Already have an account?',
    'auth.no_account': 'Don\'t have an account?',
    'auth.login_now': 'Login now',
    'auth.register_now': 'Register now',
    'auth.processing': 'Processing...',
    'auth.error': 'An error occurred',
    'auth.success': 'Registration successful! Please login.',

    // Common
    'common.search': 'Search...',
    'common.add': 'Add New',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.download_template': 'Template',
    'common.import_excel': 'Import Excel',
    'common.loading': 'Loading...',
    'common.status': 'Status',
    'common.actions': 'Actions',
  }
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('vi');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'vi' ? 'en' : 'vi');
  };

  const t = (key: string): string => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};