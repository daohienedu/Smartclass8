// Domain Entities

export interface User {
  id: string;
  username: string;
  password: string; // In real app, this should be hashed
  fullName: string;
  role: 'admin' | 'student' | 'parent';
  relatedId?: string; // Links to Student ID or Parent ID if applicable
}

export interface ClassInfo {
  id: string;
  className: string;
  schoolYear: string;
  homeroomTeacher: string;
  note?: string;
  // Legacy fields kept for compatibility or extended info
  schedule?: string;
  level?: string;
}

export interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  relationship: 'Father' | 'Mother' | 'Guardian' | 'Other';
  studentId?: string; // Optional link strictly for the Parent CRUD view if needed, though usually 1 parent -> N students or N parents -> 1 student. 
}

export interface Student {
  id: string;
  classId: string;
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female';
  address: string;
  parentId: string; // Links to Parent
  status: 'Active' | 'Inactive' | 'Suspended';
  
  // App specific fields
  avatar?: string;
  points: number; 
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  note?: string;
}

export interface AttendanceItem {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  note?: string;
}

export interface Behavior {
  id: string;
  studentId: string;
  date: string;
  type: 'PRAISE' | 'WARN';
  points: number;
  content: string;
}

export interface Announcement {
  id: string;
  classId: string; // 'all' or specific classId
  title: string;
  content: string;
  date: string; // Display date
  createdAt: string; // Sort date
  author: string;
  target: 'parent' | 'student' | 'all';
  pinned: boolean;
}

export interface Document {
  id: string;
  classId: string; // 'all' or specific classId
  title: string;
  url: string;
  category: string;
  createdAt: string;
  // New fields for Folder structure
  grade?: string; // '1', '2', '3', '4', '5'
  unit?: string;  // 'Unit 1', 'Unit 2', etc.
  
  // New fields for Embedded View & Progress
  type?: 'link' | 'pdf' | 'video'; // Default 'link'
  minDuration?: number; // Minimum seconds required to mark complete
}

export interface DocumentProgress {
  studentId: string;
  documentId: string;
  completed: boolean;
  timeSpent: number; // seconds
  lastViewedAt: string;
}

export interface Task {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  requireReply: boolean;
  createdAt: string;
  attachments?: string[]; // Teacher attachments (URLs)
  // New fields for Folder structure
  grade?: string;
  unit?: string;
}

export interface TaskReply {
  id: string;
  taskId: string;
  studentId: string;
  replyText: string;
  attachmentsJson?: string; // JSON string of links
  submittedAt: string;
  grade?: number;
  feedback?: string;
}

export interface MessageThread {
  id: string;
  studentId: string;
  classId: string;
  studentName: string; 
  lastMessageAt: string;
  unreadCount: number; // For teacher
}

export interface Message {
  id: string;
  threadId: string;
  senderRole: 'teacher' | 'student' | 'parent';
  senderName: string;
  content: string;
  createdAt: string;
}

export interface Report {
  id: string;
  studentId: string;
  type: 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  content: string;
  attendanceSummary: string;
  behaviorScore: number;
  academicPerformance: string;
}

export interface DashboardStats {
    period: string;
    attendance: {
        rate: number;
        absentCount: number;
        lateCount: number;
    };
    behavior: {
        totalPoints: number;
        warnCount: number;
        topStudents: { name: string; points: number }[];
    };
    tasks: {
        completionRate: number;
        parentReplies: number;
    };
}

// --- GAME & QUESTION BANK ---

export type QuestionType = 'multiple-choice' | 'short-answer' | 'ordering' | 'drag-drop';

export interface Question {
  id: string;
  type: QuestionType;
  level: string; // e.g., 'Starter', 'Movers', 'Flyers'
  content: string; // The question text
  // Data structure depends on type:
  // multiple-choice: JSON string of string[] (options)
  // ordering: JSON string of string[] (correct order segments)
  // drag-drop: JSON string of {left: string, right: string}[] (pairs)
  optionsJson: string; 
  correctAnswer: string; // For MC/ShortAnswer. For Ordering/DragDrop, it might be redundant or used for checking.
  points: number;
}