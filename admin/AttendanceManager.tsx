import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { ClassInfo, Student, AttendanceItem } from '../types';
import { Icon } from '../components/Icons';

export const AttendanceManager: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceItem>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    provider.classes.list().then(data => {
      setClasses(data);
      if(data.length > 0) setSelectedClassId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      loadAttendanceSheet();
    }
  }, [selectedClassId, selectedDate]);

  const loadAttendanceSheet = async () => {
    setLoading(true);
    try {
      // Fetch students for class
      const allStudents = await provider.students.list();
      const classStudents = allStudents.filter(s => s.classId === selectedClassId && s.status === 'Active');
      
      // Fetch existing attendance
      const existing = await provider.getAttendance(selectedClassId, selectedDate);
      
      const map: Record<string, AttendanceItem> = {};
      classStudents.forEach(s => {
        const record = existing.find(a => a.studentId === s.id);
        map[s.id] = {
            studentId: s.id,
            status: record?.status || 'PRESENT',
            note: record?.note || ''
        };
      });

      setStudents(classStudents);
      setAttendanceData(map);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
      setAttendanceData(prev => ({
          ...prev,
          [studentId]: { ...prev[studentId], status }
      }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceData(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], note }
    }));
  };

  const handleSave = async () => {
      setSaving(true);
      try {
          const items = Object.values(attendanceData) as AttendanceItem[];
          await provider.markAttendance({
              classId: selectedClassId,
              date: selectedDate,
              items
          });
          alert('Đã lưu điểm danh thành công!');
      } catch (e) {
          alert('Lỗi khi lưu điểm danh');
      } finally {
          setSaving(false);
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Điểm danh lớp học</h2>
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn lớp</label>
                <select 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                </select>
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày điểm danh</label>
                <input 
                    type="date" 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
          {loading ? (
              <div className="text-center text-gray-500">Đang tải danh sách...</div>
          ) : students.length === 0 ? (
              <div className="text-center text-gray-500 italic">Lớp chưa có học sinh nào.</div>
          ) : (
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="border-b border-gray-200">
                          <th className="py-3 font-semibold text-gray-600">Học sinh</th>
                          <th className="py-3 font-semibold text-gray-600 text-center w-64">Trạng thái</th>
                          <th className="py-3 font-semibold text-gray-600">Ghi chú</th>
                      </tr>
                  </thead>
                  <tbody>
                      {students.map(s => (
                          <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 font-medium text-gray-900">{s.fullName}</td>
                              <td className="py-3 flex justify-center space-x-2">
                                  {(['PRESENT', 'ABSENT', 'LATE'] as const).map(status => (
                                      <button
                                        key={status}
                                        onClick={() => handleStatusChange(s.id, status)}
                                        className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                            attendanceData[s.id]?.status === status
                                            ? status === 'PRESENT' ? 'bg-green-100 text-green-700 border-green-200'
                                            : status === 'LATE' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                            : 'bg-red-100 text-red-700 border-red-200'
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                        }`}
                                      >
                                          {status === 'PRESENT' ? 'Có mặt' : status === 'LATE' ? 'Muộn' : 'Vắng'}
                                      </button>
                                  ))}
                              </td>
                              <td className="py-3">
                                  <input 
                                    type="text" 
                                    className="w-full border-b border-gray-200 focus:border-emerald-500 outline-none bg-transparent px-2 py-1 text-sm"
                                    placeholder="Lý do..."
                                    value={attendanceData[s.id]?.note || ''}
                                    onChange={e => handleNoteChange(s.id, e.target.value)}
                                  />
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          )}
      </div>

      <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving || loading || students.length === 0}
            className="flex items-center px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
          >
              <Icon name="check" className="mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
          </button>
      </div>
    </div>
  );
};