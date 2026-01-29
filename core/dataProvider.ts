import {
  ClassInfo,
  Student,
  Parent,
  Attendance,
  AttendanceItem,
  Behavior,
  Announcement,
  Document,
  DocumentProgress,
  Task,
  TaskReply,
  MessageThread,
  Message,
  Report,
  DashboardStats,
  User,
  Question
} from '../types';

export interface DataProvider {
  // Auth
  auth: {
      login: (username: string, password: string) => Promise<User | null>;
      register: (user: Omit<User, 'id'>) => Promise<User>;
  };

  // Generic CRUD-like accessors
  students: {
    list: () => Promise<Student[]>;
    get: (id: string) => Promise<Student | null>;
    add: (data: Omit<Student, 'id'>) => Promise<Student>;
    update: (id: string, data: Partial<Student>) => Promise<Student>;
    remove: (id: string) => Promise<void>;
  };

  classes: {
    list: () => Promise<ClassInfo[]>;
    add: (data: Omit<ClassInfo, 'id'>) => Promise<ClassInfo>;
    update: (id: string, data: Partial<ClassInfo>) => Promise<ClassInfo>;
    remove: (id: string) => Promise<void>;
  };

  parents: {
    list: () => Promise<Parent[]>;
    add: (data: Omit<Parent, 'id'>) => Promise<Parent>;
    update: (id: string, data: Partial<Parent>) => Promise<Parent>;
    remove: (id: string) => Promise<void>;
  };

  behaviors: {
    list: (studentId?: string) => Promise<Behavior[]>; 
    add: (data: Omit<Behavior, 'id'>) => Promise<Behavior>;
    update: (id: string, data: Partial<Behavior>) => Promise<Behavior>;
    remove: (id: string) => Promise<void>;
  };

  announcements: {
    list: (classId?: string) => Promise<Announcement[]>; // If classId provided, filter by class + 'all'
    add: (data: Omit<Announcement, 'id'>) => Promise<Announcement>;
    update: (id: string, data: Partial<Announcement>) => Promise<Announcement>;
    remove: (id: string) => Promise<void>;
  };

  documents: {
    list: (classId?: string) => Promise<Document[]>; // If classId provided, filter by class + 'all'
    add: (data: Omit<Document, 'id'>) => Promise<Document>;
    update: (id: string, data: Partial<Document>) => Promise<Document>;
    remove: (id: string) => Promise<void>;
    // New methods for progress
    getProgress: (studentId: string) => Promise<DocumentProgress[]>;
    saveProgress: (progress: DocumentProgress) => Promise<void>;
  };
  
  questions: {
    list: (level?: string) => Promise<Question[]>;
    add: (data: Omit<Question, 'id'>) => Promise<Question>;
    update: (id: string, data: Partial<Question>) => Promise<Question>;
    remove: (id: string) => Promise<void>;
  };

  // Specific Business Logic

  // Attendance
  getAttendance: (classId: string, date: string) => Promise<Attendance[]>;
  markAttendance: (payload: { classId: string; date: string; items: AttendanceItem[] }) => Promise<void>;
  listAttendanceByStudent: (studentId: string, startDate?: string, endDate?: string) => Promise<Attendance[]>;

  // Communication
  messages: {
      listThreads: (classId?: string) => Promise<MessageThread[]>;
      getThreadByStudent: (studentId: string) => Promise<MessageThread>; // Get or create
      getMessages: (threadId: string) => Promise<Message[]>;
      send: (threadId: string, role: 'teacher' | 'student' | 'parent', content: string) => Promise<Message>;
  };

  // Tasks
  tasks: {
    list: (classId: string) => Promise<Task[]>;
    add: (data: Omit<Task, 'id'>) => Promise<Task>;
    update: (id: string, data: Partial<Task>) => Promise<Task>;
    remove: (id: string) => Promise<void>;
    getReplies: (taskId: string) => Promise<TaskReply[]>;
    reply: (data: Omit<TaskReply, 'id'>) => Promise<TaskReply>;
  };

  // Reports
  reports: {
      getWeekly: (classId: string, date: string) => Promise<DashboardStats>;
      getMonthly: (classId: string, month: string) => Promise<DashboardStats>;
  };

  // Legacy accessor for compatibility (can be removed if fully refactored, but kept for safety)
  getTasks: (classId: string) => Promise<Task[]>;
  getReports: (studentId: string) => Promise<Report[]>;
  
  // Student Individual Reports
  generateReport: (studentId: string, type: 'weekly' | 'monthly') => Promise<Report>;

  // Utility
  seedData: () => void;
}