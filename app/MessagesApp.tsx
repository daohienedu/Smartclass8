import React, { useEffect, useState, useRef } from 'react';
import { provider } from '../core/provider';
import { MessageThread, Message, Student, User } from '../types';
import { Icon } from '../components/Icons';

export const MessagesApp: React.FC = () => {
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
        try {
            const userJson = localStorage.getItem('mrs_hien_user');
            if (!userJson) {
                setLoading(false);
                return;
            }
            const user = JSON.parse(userJson) as User;
            let currentStudent: Student | null = null;

            if (user.role === 'student' && user.relatedId) {
                try {
                    currentStudent = await provider.students.get(user.relatedId);
                } catch(e) {}
            }
            if (!currentStudent) {
                const all = await provider.students.list();
                currentStudent = all.find(s => s.fullName === user.fullName) || null;
            }

            if (currentStudent) {
                // Determine thread. provider.messages.getThreadByStudent creates one if missing.
                const t = await provider.messages.getThreadByStudent(currentStudent.id);
                setThread(t);
                
                if (t) {
                    await loadMessages(t.id);
                    // Poll for messages
                    const interval = setInterval(() => loadMessages(t.id), 5000);
                    // Store interval in a ref if needed to clear, but component unmount handles it in closure usually.
                    // Better to return cleanup from useEffect.
                }
            } else {
                setError("Không tìm thấy thông tin học sinh.");
            }
        } catch (e) {
            console.error("Error initializing messages", e);
            setError("Lỗi kết nối máy chủ tin nhắn.");
        } finally {
            setLoading(false);
        }
    };
    init();
  }, []); // Only run once on mount

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (threadId: string) => {
      try {
        const msgs = await provider.messages.getMessages(threadId);
        setMessages(msgs);
      } catch (e) {
        console.warn("Failed to load messages", e);
      }
  };

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !thread) return;

      try {
        await provider.messages.send(thread.id, 'student', newMessage);
        setNewMessage('');
        loadMessages(thread.id);
      } catch (e) {
        alert("Gửi tin nhắn thất bại. Vui lòng thử lại.");
      }
  };

  if (loading) return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
          Đang kết nối...
      </div>
  );

  if (error) return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-100 m-4">
          <Icon name="alert" size={32} className="mx-auto mb-2" />
          {error}
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-emerald-600 text-white flex items-center shadow-md z-10">
            <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center font-bold mr-3 border-2 border-emerald-400 shadow-sm">
                MH
            </div>
            <div>
                <div className="font-bold text-lg">Mrs. Hien</div>
                <div className="text-xs text-emerald-100 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    Giáo viên chủ nhiệm
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <Icon name="message" size={32} className="text-emerald-200" />
                     </div>
                     <p className="font-medium text-gray-500">Chưa có tin nhắn nào.</p>
                     <p>Hãy gửi lời chào đến cô giáo nhé!</p>
                </div>
            )}
            {messages.map(m => {
                const isMe = m.senderRole !== 'teacher';
                return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                         {!isMe && (
                             <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold mr-2 mt-1 text-xs border border-emerald-200">
                                 MH
                             </div>
                         )}
                        <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm text-sm ${
                            isMe 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                        }`}>
                            <div className="whitespace-pre-wrap">{m.content}</div>
                            <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="flex gap-2">
                <input 
                    type="text" 
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-gray-50 focus:bg-white"
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    disabled={!thread}
                />
                <button 
                    type="submit" 
                    className="bg-emerald-600 text-white px-6 py-2 rounded-xl hover:bg-emerald-700 transition font-bold shadow-md shadow-emerald-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!thread || !newMessage.trim()}
                >
                    <Icon name="send" />
                </button>
            </form>
        </div>
    </div>
  );
};