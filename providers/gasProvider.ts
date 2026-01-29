import { DataProvider } from '../core/dataProvider';
import {
  ClassInfo, Student, Parent, Attendance, AttendanceItem, Behavior,
  Announcement, Document, Task, TaskReply, MessageThread, Message,
  Report, DashboardStats, User, Question
} from '../types';

// Updated URL from user input
const API_URL = "https://script.google.com/macros/s/AKfycbwarkyd3D5v8Mkq8byQm-w9FyifbmIvlkkc7BoH02yTiWL6IC_TUtNWRlg-QkqrQAPX/exec";

const fetchGAS = async (action: string, payload: any = {}) => {
  try {
    console.log(`[GAS Request] ${action}`, payload);
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
    
    const text = await res.text();
    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        console.error("Non-JSON response from GAS:", text.substring(0, 500));
        throw new Error("Không thể kết nối đến Server. Vui lòng kiểm tra lại Deploy ID và quyền truy cập 'Anyone'.");
    }

    if (!json.ok) {
        console.error(`[GAS Error] ${action}:`, json.error);
        throw new Error(json.error || 'API Error');
    }
    
    console.log(`[GAS Success] ${action}`, json.data);
    return json.data;
  } catch (e) {
    console.error(`API Call Failed: ${action}`, e);
    throw e;
  }
};

export const gasProvider: DataProvider = {
  seedData: () => { 
      // Seed data is managed by the backend setupDatabase() function in Apps Script
      console.log('Seed data is managed by the Google Apps Script backend.'); 
  },
  
  auth: {
    login: (username, password) => fetchGAS('auth.login', { username, password }),
    register: (user) => fetchGAS('auth.register', user),
  },

  students: {
    list: () => fetchGAS('students.list'),
    get: (id) => fetchGAS('students.get', { id }),
    add: (data) => fetchGAS('students.add', data),
    update: (id, data) => fetchGAS('students.update', { id, ...data }),
    remove: (id) => fetchGAS('students.remove', { id }),
  },
  
  classes: {
    list: () => fetchGAS('classes.list'),
    add: (data) => fetchGAS('classes.add', data),
    update: (id, data) => fetchGAS('classes.update', { id, ...data }),
    remove: (id) => fetchGAS('classes.remove', { id }),
  },

  parents: {
    list: () => fetchGAS('parents.list'),
    add: (data) => fetchGAS('parents.add', data),
    update: (id, data) => fetchGAS('parents.update', { id, ...data }),
    remove: (id) => fetchGAS('parents.remove', { id }),
  },

  behaviors: {
    // Changed 'behavior.list' to 'behaviors.list' to match Sheet name 'Behaviors'
    list: (studentId) => fetchGAS('behaviors.list', { filter: studentId ? { studentId } : undefined }),
    add: (data) => fetchGAS('behaviors.add', data),
    update: (id, data) => fetchGAS('behaviors.update', { id, ...data }),
    remove: (id) => fetchGAS('behaviors.remove', { id }),
  },

  announcements: {
    list: async (classId) => {
      const all = await fetchGAS('announcements.list');
      if (!Array.isArray(all)) return [];
      if (!classId) return all;
      return all.filter((a: Announcement) => a.classId === 'all' || a.classId === classId);
    },
    add: (data) => fetchGAS('announcements.add', data),
    update: (id, data) => fetchGAS('announcements.update', { id, ...data }),
    remove: (id) => fetchGAS('announcements.remove', { id }),
  },

  documents: {
    list: async (classId) => {
      const all = await fetchGAS('documents.list');
      if (!Array.isArray(all)) return [];
      if (!classId) return all;
      return all.filter((d: Document) => d.classId === 'all' || d.classId === classId);
    },
    add: (data) => fetchGAS('documents.add', data),
    update: (id, data) => fetchGAS('documents.update', { id, ...data }),
    remove: (id) => fetchGAS('documents.remove', { id }),
    getProgress: (studentId) => fetchGAS('documents.getProgress', { studentId }),
    saveProgress: (progress) => fetchGAS('documents.saveProgress', progress),
  },

  questions: {
    list: (level) => fetchGAS('questions.list', { filter: level ? { level } : undefined }),
    add: (data) => fetchGAS('questions.add', data),
    update: (id, data) => fetchGAS('questions.update', { id, ...data }),
    remove: (id) => fetchGAS('questions.remove', { id }),
  },

  getAttendance: (classId, date) => fetchGAS('attendance.list', { filter: { classId, date } }),

  markAttendance: async ({ classId, date, items }) => {
     // Check existing records to decide add or update
     const existing = await fetchGAS('attendance.list', { filter: { classId, date } });
     
     for (const item of items) {
       const record = existing.find((r: Attendance) => r.studentId === item.studentId);
       if (record) {
         if (record.status !== item.status || record.note !== item.note) {
            await fetchGAS('attendance.update', { id: record.id, ...item });
         }
       } else {
         await fetchGAS('attendance.add', { classId, date, ...item });
       }
     }
  },

  listAttendanceByStudent: async (studentId, startDate, endDate) => {
    const all = await fetchGAS('attendance.list', { filter: { studentId } });
    if (!Array.isArray(all)) return [];
    return all.filter((a: Attendance) => {
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      return true;
    });
  },

  messages: {
    listThreads: async (classId) => {
       try {
           const all = await fetchGAS('threads.list');
           if (!Array.isArray(all)) return [];
           if (classId) return all.filter((t: MessageThread) => t.classId === classId);
           return all;
       } catch (e) {
           return [];
       }
    },
    getThreadByStudent: async (studentId) => {
        try {
            const all = await fetchGAS('threads.list', { filter: { studentId } });
            if (Array.isArray(all) && all.length > 0) return all[0];
            
            // Create new thread if not exists
            const students = await fetchGAS('students.list', { filter: { id: studentId } });
            const student = students[0];
            if (!student) throw new Error('Student not found');
            
            const newThread = {
                 studentId: student.id,
                 classId: student.classId,
                 studentName: student.fullName,
                 lastMessageAt: new Date().toISOString(),
                 unreadCount: 0
            };
            return await fetchGAS('threads.add', newThread);
        } catch (e) {
            console.error('Error getting/creating thread', e);
            throw e;
        }
    },
    getMessages: (threadId) => fetchGAS('messages.list', { filter: { threadId } }),
    send: async (threadId, role, content) => {
      const msg = {
        threadId,
        senderRole: role,
        senderName: role === 'teacher' ? 'Mrs. Hien' : 'Phụ huynh/Học sinh',
        content,
        createdAt: new Date().toISOString()
      };
      await fetchGAS('messages.add', msg);
      
      // Update thread timestamp
      try {
          const threads = await fetchGAS('threads.list', { filter: { id: threadId }});
          if (Array.isArray(threads) && threads.length > 0) {
            const t = threads[0];
            await fetchGAS('threads.update', {
               id: t.id,
               lastMessageAt: msg.createdAt,
               unreadCount: role !== 'teacher' ? (Number(t.unreadCount) || 0) + 1 : Number(t.unreadCount)
            });
          }
      } catch (e) {
          console.warn('Could not update thread metadata', e);
      }
      return msg as any;
    }
  },

  tasks: {
    list: (classId) => fetchGAS('tasks.list', { filter: { classId } }),
    add: (data) => fetchGAS('tasks.add', data),
    update: (id, data) => fetchGAS('tasks.update', { id, ...data }),
    remove: (id) => fetchGAS('tasks.remove', { id }),
    getReplies: (taskId) => fetchGAS('taskReplies.list', { filter: { taskId } }),
    reply: (data) => fetchGAS('taskReplies.add', data),
  },

  reports: {
    getWeekly: (classId, date) => fetchGAS('reports.weeklySummary', { classId, date }),
    getMonthly: (classId, month) => fetchGAS('reports.monthlySummary', { classId, month }),
  },

  getTasks: (classId) => fetchGAS('tasks.list', { filter: { classId } }),
  
  getReports: async (studentId) => {
     return [];
  },

  generateReport: async (studentId, type) => {
      return {} as Report;
  }
};