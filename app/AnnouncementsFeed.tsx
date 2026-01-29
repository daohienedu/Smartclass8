import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { Announcement, User, Student } from '../types';
import { Icon } from '../components/Icons';

export const AnnouncementsFeed: React.FC = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userJson = localStorage.getItem('mrs_hien_user');
      let classId = 'all';

      if (userJson) {
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
              classId = currentStudent.classId;
          }
      }

      const data = await provider.announcements.list(classId);
      setItems(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mr-3">Bảng tin</h2>
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">{items.length} mới</span>
        </div>

        {loading ? (
            <div className="text-center py-10 text-gray-500">Đang tải tin tức...</div>
        ) : items.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                <Icon name="bell" size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Chưa có thông báo nào mới.</p>
            </div>
        ) : (
            <div className="space-y-6">
                {items.map(item => (
                    <div 
                        key={item.id} 
                        className={`bg-white rounded-xl p-6 shadow-sm border relative overflow-hidden ${item.pinned ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-100'}`}
                    >
                        {item.pinned && (
                            <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 px-3 py-1 rounded-bl-lg text-xs font-bold flex items-center">
                                <Icon name="pin" size={12} className="mr-1" /> Ghim
                            </div>
                        )}
                        <div className="flex items-center mb-3">
                            <div className={`p-2 rounded-lg mr-3 ${item.pinned ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                <Icon name="bell" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
                                <div className="text-xs text-gray-500 flex items-center">
                                    <span>{item.author}</span>
                                    <span className="mx-2">•</span>
                                    <span>{item.date}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-gray-600 leading-relaxed whitespace-pre-wrap pl-1">
                            {item.content}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};