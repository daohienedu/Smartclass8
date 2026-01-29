import React, { useEffect, useState, useRef } from 'react';
import { provider } from '../core/provider';
import { MessageThread, Message, ClassInfo, Student } from '../types';
import { Icon } from '../components/Icons';

export const MessagesManager: React.FC = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitData();
  }, []);

  const loadInitData = async () => {
    const cList = await provider.classes.list();
    setClasses(cList);
    if (cList.length > 0) {
        setSelectedClass(cList[0].id);
    }
  };

  // Load Students and Threads when Class changes
  useEffect(() => {
    if (selectedClass) {
        loadSidebarData();
    }
  }, [selectedClass]);

  const loadSidebarData = async () => {
    const [sList, tList] = await Promise.all([
        provider.students.list(),
        provider.messages.listThreads()
    ]);

    // Filter students by selected class
    const classStudents = selectedClass === 'all' 
        ? sList 
        : sList.filter(s => s.classId === selectedClass);
    
    setStudents(classStudents);
    setThreads(tList);
  };

  // Poll for messages only when a thread is active
  useEffect(() => {
    let interval: any;
    if (activeThread) {
        loadMessages(activeThread.id);
        interval = setInterval(() => {
             // Reload messages
             loadMessages(activeThread.id);
             // Reload threads silently to update unread counts in sidebar
             provider.messages.listThreads().then(setThreads); 
        }, 5000); 
    }
    return () => clearInterval(interval);
  }, [activeThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (threadId: string) => {
      const msgs = await provider.messages.getMessages(threadId);
      setMessages(msgs);
  };

  const handleSelectStudent = async (student: Student) => {
      setActiveStudent(student);
      setIsLoadingMessages(true);
      setMessages([]); // Clear previous messages UI

      try {
          // Find existing thread or create a new one via provider
          // provider.messages.getThreadByStudent handles logic: find existing OR create new
          const thread = await provider.messages.getThreadByStudent(student.id);
          setActiveThread(thread);
      } catch (e) {
          console.error("Error selecting student thread", e);
          alert("Không thể kết nối cuộc trò chuyện.");
      } finally {
          setIsLoadingMessages(false);
      }
  };

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !activeThread) return;

      const content = newMessage;
      setNewMessage(''); // Optimistic clear

      await provider.messages.send(activeThread.id, 'teacher', content);
      loadMessages(activeThread.id);
      loadSidebarData(); // Update order/timestamps
  };

  // Helper to merge Student and Thread info
  const getDisplayItems = () => {
      return students.map(student => {
          const thread = threads.find(t => t.studentId === student.id);
          return {
              student,
              thread,
              // Sort value: Thread last message time OR student name if no thread
              sortTime: thread ? new Date(thread.lastMessageAt).getTime() : 0
          };
      }).sort((a, b) => {
          // Sort by time desc (most recent msg first), then alphabetical
          if (b.sortTime !== a.sortTime) return b.sortTime - a.sortTime;
          return a.student.fullName.localeCompare(b.student.fullName);
      });
  };

  const displayItems = getDisplayItems();

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-100 bg-white">
            <h2 className="font-bold text-gray-800 mb-2 flex items-center">
                <Icon name="message" className="mr-2 text-emerald-600" /> Tin nhắn
            </h2>
            <select 
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white transition"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
            >
                {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
            </select>
        </div>
        <div className="flex-1 overflow-y-auto">
            {displayItems.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                    Không có học sinh nào trong lớp này.
                </div>
            ) : (
                displayItems.map(({ student, thread }) => (
                    <div 
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-emerald-50 transition relative ${activeStudent?.id === student.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm ${activeStudent?.id === student.id ? 'font-bold text-emerald-900' : 'font-medium text-gray-700'}`}>
                                {student.fullName}
                            </span>
                            {thread && thread.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                                    {thread.unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-end">
                             <div className="text-xs text-gray-500 truncate max-w-[180px]">
                                {thread ? 'Đã có hội thoại' : 'Chưa có tin nhắn'}
                             </div>
                             {thread && (
                                <div className="text-[10px] text-gray-400">
                                    {new Date(thread.lastMessageAt).toLocaleDateString([], {day: '2-digit', month: '2-digit'})}
                                </div>
                             )}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
          {activeStudent ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-bold mr-3 shadow-inner">
                            {activeStudent.fullName.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-gray-800">{activeStudent.fullName}</div>
                            <div className="text-xs text-gray-500 flex items-center">
                                Học sinh • {classes.find(c => c.id === activeStudent.classId)?.className}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {isLoadingMessages ? (
                        <div className="flex justify-center items-center h-full text-gray-400">
                            Đang tải hội thoại...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                                <Icon name="message" size={24} className="text-gray-400" />
                            </div>
                            <p>Chưa có tin nhắn nào.</p>
                            <p>Hãy gửi tin nhắn đầu tiên cho {activeStudent.fullName}.</p>
                        </div>
                    ) : (
                        messages.map(m => {
                            const isMe = m.senderRole === 'teacher';
                            return (
                                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm text-sm ${
                                        isMe 
                                        ? 'bg-emerald-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                        <div>{m.content}</div>
                                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                                            {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-gray-50 focus:bg-white"
                            placeholder={`Nhắn tin cho ${activeStudent.fullName}...`}
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!activeThread}
                            className="bg-emerald-600 text-white px-5 py-2 rounded-xl hover:bg-emerald-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-200"
                        >
                            <Icon name="send" />
                        </button>
                    </form>
                </div>
              </>
          ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 flex-col bg-slate-50">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <Icon name="users" size={40} className="opacity-20 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-600 mb-2">Trung tâm tin nhắn</h3>
                  <p className="text-sm">Chọn một học sinh từ danh sách bên trái để bắt đầu nhắn tin.</p>
              </div>
          )}
      </div>
    </div>
  );
};