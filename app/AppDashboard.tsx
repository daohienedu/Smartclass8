import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { Student, Task, Report, User } from '../types';
import { Icon } from '../components/Icons';
import { useNavigate } from 'react-router-dom';

export const AppDashboard: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const userJson = localStorage.getItem('mrs_hien_user');
      if (!userJson) {
          navigate('/');
          return;
      }
      const user = JSON.parse(userJson) as User;

      let currentStudent: Student | null = null;

      // 1. Try to fetch by ID if available
      if (user.role === 'student' && user.relatedId) {
          try {
             currentStudent = await provider.students.get(user.relatedId);
          } catch (e) {
             console.error("Error fetching student details", e);
          }
      }

      // 2. If not found by ID, try to find by name (fallback)
      if (!currentStudent) {
         const allStudents = await provider.students.list();
         currentStudent = allStudents.find(s => s.fullName === user.fullName) || null;
      }

      // 3. Last fallback for demo purposes ONLY if user is admin viewing app dashboard
      // or if truly no match found but we want to show something (optional, here we prefer correctness)
      if (!currentStudent && user.role === 'student') {
          // Stay null
      }

      if (currentStudent) {
        setStudent(currentStudent);
        
        const t = await provider.getTasks(currentStudent.classId);
        setTasks(t);

        const r = await provider.getReports(currentStudent.id);
        setReports(r);
      }
    };
    load();
  }, [navigate]);

  if (!student) return (
    <div className="p-8 text-center">
        <p className="text-gray-500 mb-2">Đang tải hồ sơ...</p>
        <p className="text-xs text-gray-400">Nếu bạn mới đăng ký, vui lòng đợi giáo viên duyệt hoặc kiểm tra lại thông tin.</p>
    </div>
  );

  const formatDateDisplay = (isoDate: string) => {
      if (!isoDate) return '';
      const parts = isoDate.split('T')[0].split('-');
      if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDate;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Hello, {student.fullName}! 👋</h1>
        <p className="opacity-90">Chào mừng con quay lại lớp học cùng Cô Hiền.</p>
        <div className="mt-6 flex space-x-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <span className="block text-xs uppercase opacity-75">Điểm thi đua</span>
            <span className="text-2xl font-bold">{student.points} ⭐</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <span className="block text-xs uppercase opacity-75">Bài tập mới</span>
            <span className="text-2xl font-bold">{tasks.length} 📚</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Tasks Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Icon name="book" className="mr-2 text-emerald-600" /> Bài tập về nhà
            </h2>
          </div>
          {tasks.length === 0 ? (
            <p className="text-gray-500 italic">Không có bài tập mới.</p>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="p-4 rounded-lg bg-orange-50 border border-orange-100 hover:shadow-sm transition">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800">{task.title}</h3>
                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">Due: {formatDateDisplay(task.dueDate)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                  <button className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-800">
                    Nộp bài &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reports Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Icon name="chart" className="mr-2 text-blue-600" /> Báo cáo học tập
            </h2>
          </div>
          {reports.length === 0 ? (
             <p className="text-gray-500 italic">Chưa có báo cáo nào.</p>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <div key={report.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                  <div className="bg-blue-100 p-2 rounded text-blue-600 mr-3">
                    <Icon name="check" size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 capitalize">Báo cáo {report.type}</p>
                    <p className="text-xs text-gray-500">{formatDateDisplay(report.periodStart)} - {formatDateDisplay(report.periodEnd)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};