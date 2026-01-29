import { DataProvider } from '../core/dataProvider';
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

// Changed prefix to force new seed data for specific Grade/Unit structure
const STORAGE_KEY_PREFIX = 'smart_class_v9_';

// Helper to simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for LocalStorage
const getLS = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLS = <T>(key: string, value: T): void => {
  localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const mockProvider: DataProvider = {
  seedData: () => {
    if (localStorage.getItem(STORAGE_KEY_PREFIX + 'init')) return;

    // Seed Data
    const classes: ClassInfo[] = [
      { id: 'c1', className: 'Lớp 3A', schedule: 'Thứ 2-4 17:30', level: 'Lớp 3', schoolYear: '2023-2024', homeroomTeacher: 'Mrs. Hien', note: 'Lớp chất lượng cao' },
      { id: 'c2', className: 'Lớp 5B', schedule: 'Thứ 3-5 18:00', level: 'Lớp 5', schoolYear: '2023-2024', homeroomTeacher: 'Mrs. Hien', note: '' },
    ];

    const parents: Parent[] = [
      { id: 'p1', fullName: 'Ms. Lan', phone: '0909123456', email: 'lan@example.com', relationship: 'Mother' },
      { id: 'p2', fullName: 'Mr. Hung', phone: '0909987654', email: 'hung@example.com', relationship: 'Father' },
    ];

    const students: Student[] = [
      { id: 's1', fullName: 'Tran Van Bi', dob: '2015-05-15', classId: 'c1', parentId: 'p1', points: 10, gender: 'Male', address: '123 Street A', status: 'Active' },
      { id: 's2', fullName: 'Le Thi Na', dob: '2016-08-20', classId: 'c1', parentId: 'p2', points: 15, gender: 'Female', address: '456 Street B', status: 'Active' },
    ];

    // Seed Users
    const users: User[] = [
        { id: 'u1', username: 'admin', password: '123', fullName: 'Mrs. Hien', role: 'admin' },
        { id: 'u2', username: 'bi', password: '123', fullName: 'Tran Van Bi', role: 'student', relatedId: 's1' },
        { id: 'u3', username: 'na', password: '123', fullName: 'Le Thi Na', role: 'student', relatedId: 's2' }
    ];

    const announcements: Announcement[] = [
      { id: 'ann1', classId: 'all', title: 'Nghỉ lễ 2/9', content: 'Trung tâm thông báo lịch nghỉ lễ Quốc khánh từ 1/9 đến hết 3/9.', target: 'all', pinned: true, createdAt: new Date().toISOString(), date: '2023-08-30', author: 'Admin' },
      { id: 'ann2', classId: 'c1', title: 'Ôn tập kiểm tra', content: 'Các con ôn tập Unit 1-3 để chuẩn bị kiểm tra tháng.', target: 'student', pinned: false, createdAt: new Date(Date.now() - 86400000).toISOString(), date: '2023-09-05', author: 'Mrs. Hien' }
    ];

    const documents: Document[] = [
        { id: 'doc1', classId: 'all', title: 'Nội quy lớp học', url: '#', category: 'Quy định', createdAt: new Date().toISOString(), grade: '1', unit: 'Unit 1', type: 'link' },
        { id: 'doc2', classId: 'c1', title: 'Học từ vựng qua Video', url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', category: 'Tài liệu học', createdAt: new Date().toISOString(), grade: '3', unit: 'Unit 1', type: 'video', minDuration: 10 }
    ];

    const threads: MessageThread[] = [
      { id: 't1', studentId: 's1', classId: 'c1', studentName: 'Tran Van Bi', lastMessageAt: new Date().toISOString(), unreadCount: 1 },
      { id: 't2', studentId: 's2', classId: 'c1', studentName: 'Le Thi Na', lastMessageAt: new Date().toISOString(), unreadCount: 0 },
    ];

    const messages: Message[] = [
      { id: 'm1', threadId: 't1', senderRole: 'teacher', senderName: 'Mrs. Hien', content: 'Hello, Bi forgot his book today.', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'm2', threadId: 't1', senderRole: 'parent', senderName: 'Ms. Lan', content: 'Oh sorry, I will remind him.', createdAt: new Date().toISOString() },
    ];
    
    const tasks: Task[] = [
       { id: 'task1', classId: 'c1', title: 'Unit 3 Vocabulary', description: 'Copy new words 3 times each.', dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), requireReply: true, createdAt: new Date().toISOString() },
       { id: 'task2', classId: 'c1', title: 'Reading Practice', description: 'Read page 10-12.', dueDate: new Date(Date.now() - 86400000).toISOString(), requireReply: false, createdAt: new Date().toISOString() } 
    ];

    const attendance: Attendance[] = [
        { id: 'a1', classId: 'c1', studentId: 's1', date: new Date().toISOString().split('T')[0], status: 'PRESENT', note: '' },
        { id: 'a2', classId: 'c1', studentId: 's2', date: new Date().toISOString().split('T')[0], status: 'ABSENT', note: 'Sick' }
    ];
    
    const behaviors: Behavior[] = [
        { id: 'b1', studentId: 's1', date: new Date().toISOString(), type: 'PRAISE', points: 2, content: 'Phát biểu bài sôi nổi' },
        { id: 'b2', studentId: 's1', date: new Date(Date.now() - 86400000).toISOString(), type: 'WARN', points: 0, content: 'Quên sách giáo khoa' }
    ];
    
    // --- GENERATE QUESTIONS (GAME LEVELS) ---
    let questions: Question[] = [];

    const createQuestion = (id: string, level: string, type: 'multiple-choice' | 'ordering', content: string, answer: string, opts: string[]) => ({
        id,
        type,
        level,
        points: 10,
        content,
        optionsJson: JSON.stringify(opts),
        correctAnswer: answer
    });

    // 1. LỚP 1, LỚP 2: UNIT 1 -> UNIT 16
    [1, 2].forEach(grade => {
        for (let u = 1; u <= 16; u++) {
            const levelName = `Lớp ${grade} - Unit ${u}`;
            // Q1: Multiple Choice
            questions.push(createQuestion(
                `q_g${grade}_u${u}_1`, 
                levelName, 
                'multiple-choice', 
                `[${levelName}] Chọn từ đúng cho hình ảnh (Giả lập)?`, 
                'Apple', 
                ['Apple', 'Banana', 'Car', 'Dog']
            ));
            // Q2: Ordering
            questions.push(createQuestion(
                `q_g${grade}_u${u}_2`, 
                levelName, 
                'ordering', 
                `[${levelName}] Sắp xếp câu: It is a cat`, 
                'It is a cat', 
                ['It', 'is', 'a', 'cat']
            ));
        }
    });

    // 2. LỚP 3, LỚP 4, LỚP 5: UNIT 1 -> UNIT 20
    [3, 4, 5].forEach(grade => {
        for (let u = 1; u <= 20; u++) {
            const levelName = `Lớp ${grade} - Unit ${u}`;
            // Q1: Multiple Choice
            questions.push(createQuestion(
                `q_g${grade}_u${u}_1`, 
                levelName, 
                'multiple-choice', 
                `[${levelName}] What is the capital of Vietnam?`, 
                'Hanoi', 
                ['Hanoi', 'HCM City', 'Danang', 'Hue']
            ));
            // Q2: Ordering
            questions.push(createQuestion(
                `q_g${grade}_u${u}_2`, 
                levelName, 
                'ordering', 
                `[${levelName}] Sắp xếp: She goes to school`, 
                'She goes to school', 
                ['She', 'goes', 'to', 'school']
            ));
        }
    });

    // 3. BẮC NINH TOPICS
    const bacNinhTopics = [
        "Lịch sử",
        "Văn hóa & Nghệ thuật",
        "Địa lý & Danh thắng",
        "Ẩm thực",
        "Kinh tế & Phát triển"
    ];

    bacNinhTopics.forEach((topic, idx) => {
        const levelName = `Bắc Ninh - ${topic}`;
        questions.push({
            id: `q_bn_${idx}_1`,
            type: 'multiple-choice',
            level: levelName,
            points: 10,
            content: `[${topic}] Câu hỏi trắc nghiệm tìm hiểu về ${topic} Bắc Ninh?`,
            optionsJson: JSON.stringify(['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D']),
            correctAnswer: 'Đáp án A'
        });
        questions.push({
            id: `q_bn_${idx}_2`,
            type: 'short-answer',
            level: levelName,
            points: 15,
            content: `[${topic}] Hãy kể tên một đặc điểm nổi bật của ${topic} Bắc Ninh?`,
            optionsJson: '[]',
            correctAnswer: 'Đáp án mẫu'
        });
    });

    setLS('classes', classes);
    setLS('parents', parents);
    setLS('students', students);
    setLS('users', users);
    setLS('announcements', announcements);
    setLS('documents', documents);
    setLS('threads', threads);
    setLS('messages', messages);
    setLS('tasks', tasks);
    setLS('attendance', attendance);
    setLS('behaviors', behaviors);
    setLS('questions', questions);
    setLS('taskReplies', []);
    setLS('reports', []);
    setLS('docProgress', []); // Initialize progress
    setLS('init', true);
    console.log('Database seeded v9!');
  },

  auth: {
      login: async (username, password) => {
          await delay(500);
          const users = getLS<User[]>('users', []);
          const user = users.find(u => u.username === username && u.password === password);
          return user || null;
      },
      register: async (userData) => {
          await delay(500);
          const users = getLS<User[]>('users', []);
          if (users.find(u => u.username === userData.username)) {
              throw new Error('Tên đăng nhập đã tồn tại');
          }

          const newUser: User = { ...userData, id: generateId() };
          
          // If role is student, create a linked student profile
          if (userData.role === 'student') {
              const students = getLS<Student[]>('students', []);
              const classes = getLS<ClassInfo[]>('classes', []);
              const defaultClassId = classes[0]?.id || '';
              
              const newStudent: Student = {
                  id: generateId(),
                  fullName: userData.fullName,
                  classId: defaultClassId,
                  dob: '2015-01-01', // Default
                  gender: 'Male', // Default
                  address: '',
                  status: 'Active',
                  parentId: '',
                  points: 0
              };
              setLS('students', [...students, newStudent]);
              newUser.relatedId = newStudent.id;
          }

          setLS('users', [...users, newUser]);
          return newUser;
      }
  },

  students: {
    list: async () => {
      await delay(300);
      return getLS<Student[]>('students', []);
    },
    get: async (id) => {
      await delay(200);
      const list = getLS<Student[]>('students', []);
      return list.find(s => s.id === id) || null;
    },
    add: async (data) => {
      await delay(300);
      const list = getLS<Student[]>('students', []);
      const newStudent: Student = { ...data, id: generateId(), points: 0 };
      setLS('students', [...list, newStudent]);
      return newStudent;
    },
    update: async (id, data) => {
      await delay(300);
      const list = getLS<Student[]>('students', []);
      const idx = list.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Student not found');
      const updated = { ...list[idx], ...data };
      list[idx] = updated;
      setLS('students', list);
      return updated;
    },
    remove: async (id) => {
      await delay(300);
      const list = getLS<Student[]>('students', []);
      setLS('students', list.filter(s => s.id !== id));
    }
  },

  classes: {
    list: async () => {
      await delay(200);
      return getLS<ClassInfo[]>('classes', []);
    },
    add: async (data) => {
      await delay(300);
      const list = getLS<ClassInfo[]>('classes', []);
      const newItem = { ...data, id: generateId() };
      setLS('classes', [...list, newItem]);
      return newItem;
    },
    update: async (id, data) => {
      await delay(300);
      const list = getLS<ClassInfo[]>('classes', []);
      const idx = list.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Class not found');
      const updated = { ...list[idx], ...data };
      list[idx] = updated;
      setLS('classes', list);
      return updated;
    },
    remove: async (id) => {
      await delay(300);
      const list = getLS<ClassInfo[]>('classes', []);
      setLS('classes', list.filter(c => c.id !== id));
    }
  },

  parents: {
    list: async () => {
      await delay(200);
      return getLS<Parent[]>('parents', []);
    },
    add: async (data) => {
      await delay(300);
      const list = getLS<Parent[]>('parents', []);
      const newItem = { ...data, id: generateId() };
      setLS('parents', [...list, newItem]);
      return newItem;
    },
    update: async (id, data) => {
      await delay(300);
      const list = getLS<Parent[]>('parents', []);
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Parent not found');
      const updated = { ...list[idx], ...data };
      list[idx] = updated;
      setLS('parents', list);
      return updated;
    },
    remove: async (id) => {
      await delay(300);
      const list = getLS<Parent[]>('parents', []);
      setLS('parents', list.filter(p => p.id !== id));
    }
  },

  behaviors: {
    list: async (studentId) => {
      await delay(300);
      const all = getLS<Behavior[]>('behaviors', []);
      let result = all;
      if (studentId) {
        result = result.filter(b => b.studentId === studentId);
      }
      return result.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    add: async (data) => {
      await delay(200);
      const all = getLS<Behavior[]>('behaviors', []);
      const newRecord: Behavior = { ...data, id: generateId() };
      setLS('behaviors', [newRecord, ...all]);

      if (data.points !== 0) {
        const students = getLS<Student[]>('students', []);
        const sIdx = students.findIndex(s => s.id === data.studentId);
        if (sIdx > -1) {
          students[sIdx].points += data.points;
          setLS('students', students);
        }
      }
      return newRecord;
    },
    update: async (id, data) => {
      await delay(300);
      const all = getLS<Behavior[]>('behaviors', []);
      const idx = all.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('Behavior not found');
      
      const oldPoints = all[idx].points;
      const updated = { ...all[idx], ...data };
      all[idx] = updated;
      setLS('behaviors', all);

      const newPoints = updated.points;
      if (oldPoints !== newPoints) {
         const students = getLS<Student[]>('students', []);
         const sIdx = students.findIndex(s => s.id === updated.studentId);
         if(sIdx > -1) {
             students[sIdx].points = students[sIdx].points - oldPoints + newPoints;
             setLS('students', students);
         }
      }
      return updated;
    },
    remove: async (id) => {
      await delay(300);
      const all = getLS<Behavior[]>('behaviors', []);
      const record = all.find(b => b.id === id);
      if (record && record.points !== 0) {
          const students = getLS<Student[]>('students', []);
          const sIdx = students.findIndex(s => s.id === record.studentId);
          if (sIdx > -1) {
              students[sIdx].points -= record.points;
              setLS('students', students);
          }
      }
      setLS('behaviors', all.filter(b => b.id !== id));
    }
  },

  announcements: {
    list: async (classId) => {
      await delay(200);
      let all = getLS<Announcement[]>('announcements', []);
      if (classId) {
          all = all.filter(a => a.classId === classId || a.classId === 'all');
      }
      return all.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
    add: async (data) => {
      await delay(300);
      const all = getLS<Announcement[]>('announcements', []);
      const newItem = { ...data, id: generateId() };
      setLS('announcements', [newItem, ...all]);
      return newItem;
    },
    update: async (id, data) => {
        await delay(200);
        const all = getLS<Announcement[]>('announcements', []);
        const idx = all.findIndex(a => a.id === id);
        if (idx === -1) throw new Error('Not found');
        const updated = { ...all[idx], ...data };
        all[idx] = updated;
        setLS('announcements', all);
        return updated;
    },
    remove: async (id) => {
        await delay(200);
        const all = getLS<Announcement[]>('announcements', []);
        setLS('announcements', all.filter(a => a.id !== id));
    }
  },

  documents: {
      list: async (classId) => {
        await delay(200);
        let all = getLS<Document[]>('documents', []);
        if (classId) {
            all = all.filter(d => d.classId === classId || d.classId === 'all');
        }
        return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      add: async (data) => {
        await delay(300);
        const all = getLS<Document[]>('documents', []);
        const newItem = { ...data, id: generateId() };
        setLS('documents', [newItem, ...all]);
        return newItem;
      },
      update: async (id, data) => {
          await delay(200);
          const all = getLS<Document[]>('documents', []);
          const idx = all.findIndex(d => d.id === id);
          if (idx === -1) throw new Error('Not found');
          const updated = { ...all[idx], ...data };
          all[idx] = updated;
          setLS('documents', all);
          return updated;
      },
      remove: async (id) => {
          await delay(200);
          const all = getLS<Document[]>('documents', []);
          setLS('documents', all.filter(d => d.id !== id));
      },
      getProgress: async (studentId) => {
          await delay(200);
          const all = getLS<DocumentProgress[]>('docProgress', []);
          return all.filter(p => p.studentId === studentId);
      },
      saveProgress: async (progress) => {
          await delay(200);
          const all = getLS<DocumentProgress[]>('docProgress', []);
          const idx = all.findIndex(p => p.studentId === progress.studentId && p.documentId === progress.documentId);
          if (idx > -1) {
              all[idx] = progress;
          } else {
              all.push(progress);
          }
          setLS('docProgress', all);
      }
  },
  
  questions: {
      list: async (level) => {
          await delay(200);
          let all = getLS<Question[]>('questions', []);
          if (level) {
              all = all.filter(q => q.level === level);
          }
          return all;
      },
      add: async (data) => {
          await delay(300);
          const all = getLS<Question[]>('questions', []);
          const newItem = { ...data, id: generateId() };
          setLS('questions', [newItem, ...all]);
          return newItem;
      },
      update: async (id, data) => {
          await delay(200);
          const all = getLS<Question[]>('questions', []);
          const idx = all.findIndex(q => q.id === id);
          if (idx === -1) throw new Error('Not found');
          const updated = { ...all[idx], ...data };
          all[idx] = updated;
          setLS('questions', all);
          return updated;
      },
      remove: async (id) => {
          await delay(200);
          const all = getLS<Question[]>('questions', []);
          setLS('questions', all.filter(q => q.id !== id));
      }
  },

  getAttendance: async (classId, date) => {
    await delay(300);
    const all = getLS<Attendance[]>('attendance', []);
    return all.filter(a => a.classId === classId && a.date === date);
  },

  markAttendance: async ({ classId, date, items }) => {
    await delay(400);
    const all = getLS<Attendance[]>('attendance', []);
    const others = all.filter(a => !(a.classId === classId && a.date === date));
    const newRecords: Attendance[] = items.map(item => ({
        id: generateId(),
        classId,
        date,
        studentId: item.studentId,
        status: item.status,
        note: item.note
    }));
    setLS('attendance', [...others, ...newRecords]);
  },

  listAttendanceByStudent: async (studentId, startDate, endDate) => {
      await delay(300);
      const all = getLS<Attendance[]>('attendance', []);
      let filtered = all.filter(a => a.studentId === studentId);
      if (startDate) filtered = filtered.filter(a => a.date >= startDate);
      if (endDate) filtered = filtered.filter(a => a.date <= endDate);
      return filtered.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  messages: {
      listThreads: async (classId) => {
          await delay(200);
          let all = getLS<MessageThread[]>('threads', []);
          if(classId) {
              all = all.filter(t => t.classId === classId);
          }
          return all.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      },
      getThreadByStudent: async (studentId) => {
          await delay(200);
          let all = getLS<MessageThread[]>('threads', []);
          let thread = all.find(t => t.studentId === studentId);
          if (!thread) {
              // Get student details to create proper thread
              const students = getLS<Student[]>('students', []);
              const s = students.find(st => st.id === studentId);
              if (!s) throw new Error('Student not found for thread creation');
              
              thread = {
                  id: generateId(),
                  studentId: s.id,
                  classId: s.classId,
                  studentName: s.fullName,
                  lastMessageAt: new Date().toISOString(),
                  unreadCount: 0
              };
              setLS('threads', [...all, thread]);
          }
          return thread;
      },
      getMessages: async (threadId) => {
          await delay(200);
          const all = getLS<Message[]>('messages', []);
          return all.filter(m => m.threadId === threadId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },
      send: async (threadId, role, content) => {
          await delay(200);
          const allMsgs = getLS<Message[]>('messages', []);
          const newMsg: Message = {
              id: generateId(),
              threadId,
              senderRole: role,
              senderName: role === 'teacher' ? 'Mrs. Hien' : 'Phụ huynh/Học sinh',
              content,
              createdAt: new Date().toISOString()
          };
          setLS('messages', [...allMsgs, newMsg]);
          
          // Update thread metadata
          const threads = getLS<MessageThread[]>('threads', []);
          const tIdx = threads.findIndex(t => t.id === threadId);
          if (tIdx > -1) {
              threads[tIdx].lastMessageAt = newMsg.createdAt;
              if (role !== 'teacher') {
                  threads[tIdx].unreadCount += 1;
              }
              setLS('threads', threads);
          }
          return newMsg;
      }
  },

  // Task Implementation
  tasks: {
    list: async (classId) => {
        await delay(200);
        const all = getLS<Task[]>('tasks', []);
        return all.filter(t => t.classId === classId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    add: async (data) => {
        await delay(300);
        const all = getLS<Task[]>('tasks', []);
        const newItem = { ...data, id: generateId() };
        setLS('tasks', [newItem, ...all]);
        return newItem;
    },
    update: async (id, data) => {
        await delay(200);
        const all = getLS<Task[]>('tasks', []);
        const idx = all.findIndex(t => t.id === id);
        if (idx === -1) throw new Error('Not found');
        const updated = { ...all[idx], ...data };
        all[idx] = updated;
        setLS('tasks', all);
        return updated;
    },
    remove: async (id) => {
        await delay(200);
        const all = getLS<Task[]>('tasks', []);
        setLS('tasks', all.filter(t => t.id !== id));
    },
    getReplies: async (taskId) => {
        await delay(200);
        const all = getLS<TaskReply[]>('taskReplies', []);
        return all.filter(r => r.taskId === taskId);
    },
    reply: async (data) => {
        await delay(300);
        const all = getLS<TaskReply[]>('taskReplies', []);
        // Replace existing reply if any? For now just append
        const newItem = { ...data, id: generateId() };
        setLS('taskReplies', [...all, newItem]);
        return newItem;
    }
  },

  reports: {
      getWeekly: async (classId, date) => {
          await delay(300);
          const students = getLS<Student[]>('students', []).filter(s => s.classId === classId);
          const studentIds = students.map(s => s.id);

          // Calculate week start/end
          const d = new Date(date);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
          const monday = new Date(d.setDate(diff));
          const sunday = new Date(d.setDate(diff + 6));
          const monStr = monday.toISOString().split('T')[0];
          const sunStr = sunday.toISOString().split('T')[0];

          // Attendance
          const allAtt = getLS<Attendance[]>('attendance', []);
          const weekAtt = allAtt.filter(a => a.classId === classId && a.date >= monStr && a.date <= sunStr);
          const present = weekAtt.filter(a => a.status === 'PRESENT').length;
          const late = weekAtt.filter(a => a.status === 'LATE').length;
          const absent = weekAtt.filter(a => a.status === 'ABSENT').length;
          const totalRecords = present + late + absent;
          const rate = totalRecords > 0 ? Math.round(((present + late * 0.5) / totalRecords) * 100) : 0;

          // Behavior
          const allBeh = getLS<Behavior[]>('behaviors', []);
          const weekBeh = allBeh.filter(b => studentIds.includes(b.studentId) && b.date >= monStr && b.date <= sunStr); // Simplified comparison
          const points = weekBeh.reduce((acc, curr) => acc + curr.points, 0);
          const warns = weekBeh.filter(b => b.type === 'WARN').length;
          
          // Sort top students by points in this week
          const pointsMap: Record<string, number> = {};
          weekBeh.forEach(b => {
              pointsMap[b.studentId] = (pointsMap[b.studentId] || 0) + b.points;
          });
          const topStudents = Object.entries(pointsMap)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([id, p]) => ({ name: students.find(s => s.id === id)?.fullName || 'Unknown', points: p }));

          // Tasks
          // Mocking task stats since tasks don't strict dates like logs
          const allTasks = getLS<Task[]>('tasks', []);
          const weekTasks = allTasks.filter(t => t.classId === classId && t.dueDate >= monStr && t.dueDate <= sunStr);
          
          return {
              period: `${monStr} to ${sunStr}`,
              attendance: { rate, absentCount: absent, lateCount: late },
              behavior: { totalPoints: points, warnCount: warns, topStudents },
              tasks: { completionRate: weekTasks.length > 0 ? 85 : 0, parentReplies: 12 } // Mocked
          };
      },
      getMonthly: async (classId, monthStr) => {
          // monthStr format "YYYY-MM"
          await delay(300);
          const students = getLS<Student[]>('students', []).filter(s => s.classId === classId);
          const studentIds = students.map(s => s.id);

          // Attendance
          const allAtt = getLS<Attendance[]>('attendance', []);
          const monthAtt = allAtt.filter(a => a.classId === classId && a.date.startsWith(monthStr));
          const present = monthAtt.filter(a => a.status === 'PRESENT').length;
          const late = monthAtt.filter(a => a.status === 'LATE').length;
          const absent = monthAtt.filter(a => a.status === 'ABSENT').length;
          const totalRecords = present + late + absent;
          const rate = totalRecords > 0 ? Math.round(((present + late * 0.5) / totalRecords) * 100) : 0;

          // Behavior
          const allBeh = getLS<Behavior[]>('behaviors', []);
          const monthBeh = allBeh.filter(b => studentIds.includes(b.studentId) && b.date.startsWith(monthStr));
          const points = monthBeh.reduce((acc, curr) => acc + curr.points, 0);
          const warns = monthBeh.filter(b => b.type === 'WARN').length;
          
          const pointsMap: Record<string, number> = {};
          monthBeh.forEach(b => {
              pointsMap[b.studentId] = (pointsMap[b.studentId] || 0) + b.points;
          });
          const topStudents = Object.entries(pointsMap)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([id, p]) => ({ name: students.find(s => s.id === id)?.fullName || 'Unknown', points: p }));

          return {
              period: `Tháng ${monthStr}`,
              attendance: { rate, absentCount: absent, lateCount: late },
              behavior: { totalPoints: points, warnCount: warns, topStudents },
              tasks: { completionRate: 90, parentReplies: 45 } // Mocked
          };
      }
  },

  // Fallback / Alias for AppDashboard
  getTasks: async (classId) => {
    await delay(200);
    const all = getLS<Task[]>('tasks', []);
    return all.filter(t => t.classId === classId);
  },

  getReports: async (studentId) => {
      await delay(200);
      const all = getLS<Report[]>('reports', []);
      return all.filter(r => r.studentId === studentId);
  },

  generateReport: async (studentId, type) => {
      await delay(500);
      return {} as Report;
  }
};