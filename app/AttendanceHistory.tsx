import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { Attendance, Student, User } from '../types';
import { Icon } from '../components/Icons';

export const AttendanceHistory: React.FC = () => {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userJson = localStorage.getItem('mrs_hien_user');
      let studentId = '';

      if (userJson) {
          const user = JSON.parse(userJson) as User;
          if (user.role === 'student' && user.relatedId) {
             studentId = user.relatedId;
          } else {
             // Fallback lookup
             const students = await provider.students.list();
             const found = students.find(s => s.fullName === user.fullName);
             if (found) studentId = found.id;
          }
      }

      if (studentId) {
        const data = await provider.listAttendanceByStudent(studentId);
        setRecords(data);
      }
      setLoading(false);
    };
    load();
  }, []);

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'PRESENT': return 'text-green-600 bg-green-50 border-green-100';
          case 'LATE': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
          case 'ABSENT': return 'text-red-600 bg-red-50 border-red-100';
          default: return 'text-gray-600 bg-gray-50';
      }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
        case 'PRESENT': return 'Có mặt';
        case 'LATE': return 'Đi muộn';
        case 'ABSENT': return 'Vắng mặt';
        default: return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
           <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold text-gray-800 flex items-center">
                   <Icon name="calendar" className="mr-2 text-emerald-600" />
                   Lịch sử chuyên cần
               </h2>
               <div className="text-sm text-gray-500">Tháng này</div>
           </div>

           {loading ? (
               <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
           ) : records.length === 0 ? (
               <div className="text-center py-8 text-gray-500 italic">Chưa có dữ liệu điểm danh nào.</div>
           ) : (
               <div className="grid gap-4 md:grid-cols-2">
                   {records.map(record => (
                       <div key={record.id} className={`p-4 rounded-lg border flex items-center justify-between ${getStatusColor(record.status)}`}>
                           <div className="flex items-center">
                               <div className="mr-4 text-center bg-white bg-opacity-60 rounded p-2 min-w-[60px]">
                                   <div className="text-xs font-bold uppercase">{new Date(record.date).toLocaleString('default', { month: 'short' })}</div>
                                   <div className="text-xl font-bold">{new Date(record.date).getDate()}</div>
                               </div>
                               <div>
                                   <div className="font-bold">{getStatusLabel(record.status)}</div>
                                   {record.note && <div className="text-sm opacity-80 italic">{record.note}</div>}
                               </div>
                           </div>
                           <div className="bg-white rounded-full p-1 opacity-50">
                                {record.status === 'PRESENT' && <Icon name="check" size={16} />}
                                {record.status === 'ABSENT' && <span className="font-bold px-1">✕</span>}
                                {record.status === 'LATE' && <Icon name="calendar" size={16} />}
                           </div>
                       </div>
                   ))}
               </div>
           )}
       </div>
    </div>
  );
};