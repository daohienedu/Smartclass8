import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { Student } from '../types';
import { Icon } from '../components/Icons';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ students: 0, attendanceRate: 0, totalPraise: 0, warnings: 0 });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);

  useEffect(() => {
    const load = async () => {
      const s = await provider.students.list();
      const b = await provider.behaviors.list();
      
      const praise = b.filter(x => x.type === 'PRAISE').reduce((acc, curr) => acc + curr.points, 0);
      const warns = b.filter(x => x.type === 'WARN').length;

      // Mock stats calculation for others
      setStats({ 
        students: s.length, 
        attendanceRate: 95, 
        totalPraise: praise, 
        warnings: warns 
      });
      setRecentStudents(s.slice(0, 5));
    };
    load();
  }, []);

  const formatDateDisplay = (isoDate?: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Tổng học sinh</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icon name="users" size={20} /></div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.students}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Tỉ lệ chuyên cần</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Icon name="check" size={20} /></div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.attendanceRate}%</div>
          <p className="text-xs text-green-600 mt-1">↑ 2% so với tuần trước</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Điểm khen thưởng</h3>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Icon name="star" size={20} /></div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalPraise}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-gray-500 text-sm font-medium">Lượt nhắc nhở</h3>
             <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Icon name="alert" size={20} /></div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.warnings}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Học sinh mới cập nhật</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Họ và Tên</th>
                <th className="px-6 py-3">Ngày sinh</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3">Điểm tích lũy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentStudents.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{s.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDateDisplay(s.dob)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">
                      {s.points} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};