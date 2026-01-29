import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { Behavior, Student, User } from '../types';
import { Icon } from '../components/Icons';

export const BehaviorHistory: React.FC = () => {
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userJson = localStorage.getItem('mrs_hien_user');
      let currentStudent: Student | null = null;

      if (userJson) {
          const user = JSON.parse(userJson) as User;
          if (user.role === 'student' && user.relatedId) {
             try {
                currentStudent = await provider.students.get(user.relatedId);
             } catch(e) {}
          }
          if (!currentStudent) {
             const all = await provider.students.list();
             currentStudent = all.find(s => s.fullName === user.fullName) || null;
          }
      }

      if (currentStudent) {
        setStudent(currentStudent);
        const data = await provider.behaviors.list(currentStudent.id);
        setBehaviors(data);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (!student) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;

  const formatDateDisplay = (isoDate: string) => {
      if (!isoDate) return '';
      const parts = isoDate.split('T')[0].split('-');
      if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDate;
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-8 text-white shadow-lg mb-8 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">Bảng vàng thành tích</h1>
                <p className="opacity-90 mt-1">Cố gắng tích lũy thật nhiều điểm tốt nhé!</p>
            </div>
            <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <span className="block text-sm uppercase font-bold tracking-wider opacity-80">Tổng điểm</span>
                <span className="text-4xl font-extrabold">{student.points}</span>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Icon name="star" className="mr-2 text-yellow-500" /> Lịch sử hoạt động
            </h2>
            
            {loading ? (
                <div className="text-center text-gray-500 py-8">Đang tải...</div>
            ) : behaviors.length === 0 ? (
                <div className="text-center text-gray-500 py-8 italic">Chưa có ghi nhận nào.</div>
            ) : (
                <div className="space-y-4">
                    {behaviors.map(b => (
                        <div key={b.id} className={`flex items-start p-4 rounded-lg border ${b.type === 'PRAISE' ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'}`}>
                            <div className={`p-2 rounded-full mr-4 ${b.type === 'PRAISE' ? 'bg-yellow-200 text-yellow-700' : 'bg-red-200 text-red-700'}`}>
                                <Icon name={b.type === 'PRAISE' ? 'star' : 'alert'} size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold ${b.type === 'PRAISE' ? 'text-yellow-800' : 'text-red-800'}`}>
                                        {b.type === 'PRAISE' ? 'Khen ngợi' : 'Nhắc nhở'}
                                    </h3>
                                    <span className="text-xs text-gray-500">{formatDateDisplay(b.date)}</span>
                                </div>
                                <p className="text-gray-800 mt-1">{b.content}</p>
                            </div>
                            <div className={`ml-4 font-bold text-lg ${b.type === 'PRAISE' ? 'text-yellow-600' : 'text-red-600'}`}>
                                {b.type === 'PRAISE' ? '+' : ''}{b.points}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};