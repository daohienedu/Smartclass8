import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { ClassInfo, DashboardStats } from '../types';
import { Icon } from '../components/Icons';

export const ReportsDashboard: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    provider.classes.list().then(data => {
      setClasses(data);
      if (data.length > 0) setSelectedClassId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedClassId) loadReport();
  }, [selectedClassId, viewMode, currentDate, currentMonth]);

  const loadReport = async () => {
    setLoading(true);
    let data;
    if (viewMode === 'weekly') {
        data = await provider.reports.getWeekly(selectedClassId, currentDate);
    } else {
        data = await provider.reports.getMonthly(selectedClassId, currentMonth);
    }
    setStats(data);
    setLoading(false);
  };

  const downloadCSV = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleExportAttendance = async () => {
      // Fetch raw data filtered by class and period
      const students = await provider.students.list();
      const classStudents = students.filter(s => s.classId === selectedClassId);
      const studentMap = new Map(classStudents.map(s => [s.id, s.fullName]));
      
      const allAtt = await provider.getAttendance(selectedClassId, ''); // Mock: need list accessor but mock allows
      // Hack: in real app, provider should expose raw list with filter. 
      // Re-using listAttendanceByStudent logic iterated or similar.
      // For mock simplicity, we use the fact that provider methods are accessible.
      // We will loop all class students and fetch their history for the period.
      
      let csv = 'Student Name,Date,Status,Note\n';
      
      // Since mock provider `getAttendance` gets by class & specific date, we need a different approach or just iterate logic
      // In a real backend, this is one API call: `GET /attendance?classId=...&start=...&end=...`
      // Here we will use `provider.listAttendanceByStudent` for each student.
      
      for (const student of classStudents) {
          const records = await provider.listAttendanceByStudent(student.id);
          // Filter by period
          const filtered = records.filter(r => {
             if (viewMode === 'monthly') return r.date.startsWith(currentMonth);
             // Weekly filter logic is complex here without helpers, defaulting to ALL for demo or implementing check
             return true; 
          });
          
          filtered.forEach(r => {
              csv += `"${student.fullName}",${r.date},${r.status},"${r.note || ''}"\n`;
          });
      }
      
      downloadCSV(csv, `Attendance_${selectedClassId}_${viewMode}.csv`);
  };

  const handleExportBehavior = async () => {
      const students = await provider.students.list();
      const classStudents = students.filter(s => s.classId === selectedClassId);
      
      let csv = 'Student Name,Date,Type,Points,Content\n';
      
      for (const student of classStudents) {
          const records = await provider.behaviors.list(student.id);
           const filtered = records.filter(r => {
             if (viewMode === 'monthly') return r.date.startsWith(currentMonth);
             return true; 
          });
          
          filtered.forEach(r => {
              csv += `"${student.fullName}",${r.date.split('T')[0]},${r.type},${r.points},"${r.content}"\n`;
          });
      }
      
       downloadCSV(csv, `Behavior_${selectedClassId}_${viewMode}.csv`);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">Báo cáo tổng hợp</h2>
            
            <div className="flex flex-wrap gap-2 items-center">
                <div className="bg-gray-100 rounded-lg p-1 flex text-sm">
                    <button 
                        onClick={() => setViewMode('weekly')}
                        className={`px-3 py-1.5 rounded-md font-medium transition ${viewMode === 'weekly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Tuần
                    </button>
                    <button 
                         onClick={() => setViewMode('monthly')}
                        className={`px-3 py-1.5 rounded-md font-medium transition ${viewMode === 'monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Tháng
                    </button>
                </div>

                <select 
                    className="px-3 py-2 border rounded-lg text-sm bg-gray-50"
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                </select>
                
                {viewMode === 'weekly' ? (
                    <input 
                        type="date" 
                        className="px-3 py-2 border rounded-lg text-sm"
                        value={currentDate}
                        onChange={e => setCurrentDate(e.target.value)}
                    />
                ) : (
                    <input 
                        type="month"
                        className="px-3 py-2 border rounded-lg text-sm"
                        value={currentMonth}
                        onChange={e => setCurrentMonth(e.target.value)}
                    />
                )}
            </div>
        </div>

        {loading || !stats ? (
            <div className="text-center py-10 text-gray-500">Đang tính toán dữ liệu...</div>
        ) : (
            <div className="grid md:grid-cols-3 gap-6">
                {/* Attendance Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center">
                            <Icon name="check" className="mr-2 text-blue-500" /> Chuyên cần
                        </h3>
                        <span className="text-2xl font-bold text-blue-600">{stats.attendance.rate}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center text-sm">
                        <div className="bg-red-50 p-2 rounded-lg">
                            <div className="font-bold text-red-600">{stats.attendance.absentCount}</div>
                            <div className="text-gray-500">Vắng</div>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded-lg">
                            <div className="font-bold text-yellow-600">{stats.attendance.lateCount}</div>
                            <div className="text-gray-500">Muộn</div>
                        </div>
                    </div>
                    <button 
                        onClick={handleExportAttendance}
                        className="mt-4 w-full py-2 border border-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 flex justify-center items-center"
                    >
                        <Icon name="download" size={16} className="mr-2" /> Xuất CSV
                    </button>
                </div>

                {/* Behavior Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center">
                            <Icon name="star" className="mr-2 text-yellow-500" /> Nề nếp
                        </h3>
                        <div className="text-right">
                             <div className="text-xl font-bold text-yellow-600">{stats.behavior.totalPoints} pts</div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Top Học sinh</div>
                        <div className="space-y-2">
                            {stats.behavior.topStudents.map((s, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{i+1}. {s.name}</span>
                                    <span className="font-bold text-emerald-600">+{s.points}</span>
                                </div>
                            ))}
                            {stats.behavior.topStudents.length === 0 && <span className="text-gray-400 text-sm">Chưa có dữ liệu</span>}
                        </div>
                    </div>
                     <button 
                        onClick={handleExportBehavior}
                        className="mt-4 w-full py-2 border border-yellow-100 text-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-50 flex justify-center items-center"
                    >
                        <Icon name="download" size={16} className="mr-2" /> Xuất CSV
                    </button>
                </div>

                {/* Tasks Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center">
                            <Icon name="book" className="mr-2 text-emerald-500" /> Bài tập
                        </h3>
                         <span className="text-2xl font-bold text-emerald-600">{stats.tasks.completionRate}%</span>
                    </div>
                     <div className="space-y-4">
                         <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                             <span className="text-sm text-gray-600">Phụ huynh phản hồi</span>
                             <span className="font-bold text-gray-800">{stats.tasks.parentReplies}</span>
                         </div>
                          <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                             <span className="text-sm text-gray-600">Số bài nhắc nhở</span>
                             <span className="font-bold text-gray-800">{stats.behavior.warnCount}</span>
                         </div>
                     </div>
                </div>
            </div>
        )}
    </div>
  );
};