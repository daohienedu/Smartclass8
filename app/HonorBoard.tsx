import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { Student, ClassInfo, TaskReply } from '../types';
import { Icon } from '../components/Icons';

interface StudentStats {
    student: Student;
    className: string;
    points: number;
    totalTasks: number;
    completedTasks: number;
    progressPercent: number;
    badges: BadgeType[];
}

type BadgeType = 'legend' | 'hardworking' | 'bookworm' | 'rising_star';

const BADGE_CONFIG: Record<BadgeType, { label: string, icon: string, color: string, desc: string }> = {
    legend: { label: 'Huyền Thoại', icon: 'crown', color: 'text-yellow-600 bg-yellow-100 border-yellow-200', desc: 'Top 3 điểm cao nhất' },
    hardworking: { label: 'Ong Chăm Chỉ', icon: 'check', color: 'text-green-600 bg-green-100 border-green-200', desc: 'Hoàn thành 100% bài tập' },
    bookworm: { label: 'Mọt Sách', icon: 'book', color: 'text-blue-600 bg-blue-100 border-blue-200', desc: 'Hoàn thành > 50% bài tập' },
    rising_star: { label: 'Tài Năng Trẻ', icon: 'star', color: 'text-purple-600 bg-purple-100 border-purple-200', desc: 'Điểm tích lũy > 20' }
};

export const HonorBoard: React.FC = () => {
  const [stats, setStats] = useState<StudentStats[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'points' | 'progress'>('points');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const [students, classesList, tasks] = await Promise.all([
            provider.students.list(),
            provider.classes.list(),
            provider.tasks.list('all'), // Get Global Tasks
        ]);
        
        // We also need class specific tasks. Since provider.tasks.list takes classId, 
        // ideally we fetch all. For optimization in this demo, we'll fetch tasks for all classes roughly 
        // or assume the user wants to see stats based on currently loaded data.
        // Let's fetch class-specific tasks for all classes to be accurate.
        const classTaskPromises = classesList.map(c => provider.tasks.list(c.id));
        const classTasksResults = await Promise.all(classTaskPromises);
        const allTasks = [...tasks, ...classTasksResults.flat()];
        
        // Remove duplicates if any
        const uniqueTasks = Array.from(new Map(allTasks.map(item => [item.id, item])).values());

        // Fetch Replies. 
        // WARNING: In a real high-scale app, this should be a backend aggregation.
        // Here we fetch replies for all tasks to calculate completion.
        const replyPromises = uniqueTasks.map(t => provider.tasks.getReplies(t.id));
        const repliesResults = await Promise.all(replyPromises);
        const allReplies = repliesResults.flat();

        setClasses(classesList);

        // Calculate Stats
        const calculatedStats: StudentStats[] = students.map(s => {
            const classInfo = classesList.find(c => c.id === s.classId);
            
            // 1. Identify tasks assigned to this student
            const assignedTasks = uniqueTasks.filter(t => t.classId === 'all' || t.classId === s.classId);
            
            // 2. Count distinct tasks completed by this student
            // (A reply exists for the task by this student)
            const completedCount = assignedTasks.filter(t => 
                allReplies.some(r => r.taskId === t.id && r.studentId === s.id)
            ).length;
            
            const total = assignedTasks.length;
            const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

            // 3. Determine Badges
            // Rank logic is relative to the whole set, calculated later or here?
            // Badges independent of rank:
            const badges: BadgeType[] = [];
            if (total > 0 && percent === 100) badges.push('hardworking');
            else if (total > 0 && percent >= 50) badges.push('bookworm');
            if (s.points >= 20) badges.push('rising_star');
            // 'legend' is added after sorting

            return {
                student: s,
                className: classInfo?.className || '',
                points: s.points,
                totalTasks: total,
                completedTasks: completedCount,
                progressPercent: percent,
                badges
            };
        });

        // Add Legend Badge to Top 3 Global
        const sortedGlobal = [...calculatedStats].sort((a, b) => b.points - a.points);
        const top3Ids = sortedGlobal.slice(0, 3).map(s => s.student.id);
        
        calculatedStats.forEach(s => {
            if (top3Ids.includes(s.student.id) && s.points > 0) {
                s.badges.unshift('legend');
            }
        });

        setStats(calculatedStats);
    } catch (e) {
        console.error("Failed to load honor board", e);
    } finally {
        setLoading(false);
    }
  };

  // Filter & Sort
  const filteredStats = stats.filter(s => selectedClass === 'all' || s.student.classId === selectedClass);
  
  const sortedStats = [...filteredStats].sort((a, b) => {
      if (sortBy === 'points') {
          if (b.points !== a.points) return b.points - a.points;
          return b.progressPercent - a.progressPercent; // Tie-breaker
      } else {
          if (b.progressPercent !== a.progressPercent) return b.progressPercent - a.progressPercent;
          return b.points - a.points; // Tie-breaker
      }
  });

  const renderPodium = () => {
      if (sortedStats.length === 0) return null;
      const top3 = sortedStats.slice(0, 3);
      // Fill to ensure 3 slots for visual balance if needed, or handle < 3
      const rank1 = top3[0];
      const rank2 = top3[1];
      const rank3 = top3[2];

      return (
          <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8 mb-10 pt-6">
               {/* Rank 2 */}
               {rank2 && (
                   <div className="flex flex-col items-center order-2 md:order-1 opacity-90 hover:opacity-100 transition transform hover:scale-105 cursor-pointer">
                       <div className="mb-2 text-center">
                            <div className="font-bold text-gray-700 truncate max-w-[120px]">{rank2.student.fullName}</div>
                            <div className="text-xs text-gray-500">{rank2.className}</div>
                            <div className="text-emerald-600 font-bold text-sm mt-1">
                                {sortBy === 'progress' ? `${rank2.progressPercent}% HT` : `${rank2.points} pts`}
                            </div>
                       </div>
                       <div className="w-20 md:w-28 h-28 md:h-36 bg-gradient-to-b from-gray-100 to-gray-300 rounded-t-lg border-t-4 border-gray-400 flex flex-col items-center justify-end pb-4 shadow-lg relative">
                           <div className="text-4xl font-black text-gray-500 opacity-20 absolute top-2">2</div>
                           <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-white shadow-sm z-10 mb-2">
                                {rank2.student.avatar ? <img src={rank2.student.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">{rank2.student.fullName[0]}</div>}
                           </div>
                           <div className="h-2 w-16 bg-gray-400 rounded-full"></div>
                       </div>
                   </div>
               )}

               {/* Rank 1 */}
               {rank1 && (
                   <div className="flex flex-col items-center order-1 md:order-2 z-10 transform scale-110 hover:scale-115 transition cursor-pointer">
                        <Icon name="crown" className="text-yellow-500 mb-2 animate-bounce" size={32} />
                        <div className="mb-2 text-center">
                            <div className="font-bold text-gray-900 text-lg truncate max-w-[150px]">{rank1.student.fullName}</div>
                            <div className="text-xs text-gray-500">{rank1.className}</div>
                            <div className="text-yellow-600 font-extrabold text-xl mt-1">
                                {sortBy === 'progress' ? `${rank1.progressPercent}% HT` : `${rank1.points} pts`}
                            </div>
                        </div>
                        <div className="w-24 md:w-36 h-36 md:h-48 bg-gradient-to-b from-yellow-50 to-yellow-200 rounded-t-lg border-t-4 border-yellow-400 flex flex-col items-center justify-end pb-4 shadow-xl relative">
                            <div className="text-6xl font-black text-yellow-500 opacity-20 absolute top-2">1</div>
                            <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden bg-white shadow-sm z-10 mb-2">
                                {rank1.student.avatar ? <img src={rank1.student.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xl">{rank1.student.fullName[0]}</div>}
                            </div>
                            <div className="h-2 w-20 bg-yellow-400 rounded-full"></div>
                        </div>
                   </div>
               )}

               {/* Rank 3 */}
               {rank3 && (
                   <div className="flex flex-col items-center order-3 opacity-90 hover:opacity-100 transition transform hover:scale-105 cursor-pointer">
                        <div className="mb-2 text-center">
                            <div className="font-bold text-gray-700 truncate max-w-[120px]">{rank3.student.fullName}</div>
                            <div className="text-xs text-gray-500">{rank3.className}</div>
                            <div className="text-orange-600 font-bold text-sm mt-1">
                                {sortBy === 'progress' ? `${rank3.progressPercent}% HT` : `${rank3.points} pts`}
                            </div>
                        </div>
                        <div className="w-20 md:w-28 h-20 md:h-28 bg-gradient-to-b from-orange-50 to-orange-200 rounded-t-lg border-t-4 border-orange-400 flex flex-col items-center justify-end pb-4 shadow-lg relative">
                            <div className="text-4xl font-black text-orange-500 opacity-20 absolute top-2">3</div>
                             <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-white shadow-sm z-10 mb-2">
                                {rank3.student.avatar ? <img src={rank3.student.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">{rank3.student.fullName[0]}</div>}
                            </div>
                            <div className="h-2 w-16 bg-orange-400 rounded-full"></div>
                        </div>
                   </div>
               )}
          </div>
      );
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Đang cập nhật bảng vàng...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
        {/* Banner */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-8 text-white shadow-lg overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0 text-center md:text-left">
                    <h1 className="text-3xl font-extrabold uppercase tracking-widest flex items-center justify-center md:justify-start">
                        <Icon name="trophy" className="mr-3 text-yellow-300" size={36} />
                        Bảng Vàng Vinh Danh
                    </h1>
                    <p className="opacity-90 mt-2 font-medium">Ghi nhận thành tích học tập và rèn luyện xuất sắc</p>
                </div>
                
                {/* Stats Summary Widget */}
                <div className="flex gap-4">
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-3 text-center min-w-[100px]">
                        <span className="block text-2xl font-bold">{stats.length}</span>
                        <span className="text-xs uppercase opacity-80">Học sinh</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-3 text-center min-w-[100px]">
                        <span className="block text-2xl font-bold">{stats.reduce((acc, s) => acc + (s.badges.length > 0 ? 1 : 0), 0)}</span>
                        <span className="text-xs uppercase opacity-80">Nhận Huy hiệu</span>
                    </div>
                </div>
            </div>
            {/* Background Decor */}
            <div className="absolute -top-10 -right-10 w-60 h-60 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-20 w-40 h-40 bg-yellow-300 opacity-10 rounded-full blur-2xl"></div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-4 z-20">
            <div className="flex items-center gap-2 w-full md:w-auto">
                <label className="text-sm font-bold text-gray-700 whitespace-nowrap">Lọc theo lớp:</label>
                <select 
                    className="flex-1 md:w-48 px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white transition"
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                >
                    <option value="all">Toàn trường</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                </select>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setSortBy('points')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center ${
                        sortBy === 'points' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Icon name="star" size={16} className="mr-2" /> Điểm số
                </button>
                <button
                    onClick={() => setSortBy('progress')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center ${
                        sortBy === 'progress' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Icon name="chart" size={16} className="mr-2" /> Tiến độ bài tập
                </button>
            </div>
        </div>

        {/* PODIUM */}
        {renderPodium()}

        {/* LEADERBOARD LIST */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 text-center w-16">Hạng</th>
                            <th className="px-6 py-4">Học sinh</th>
                            <th className="px-6 py-4 text-center w-32">Điểm Tích Lũy</th>
                            <th className="px-6 py-4 w-48">Tiến độ nộp bài</th>
                            <th className="px-6 py-4">Huy hiệu đạt được</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedStats.map((s, idx) => {
                            const rank = idx + 1;
                            const isTop3 = rank <= 3;
                            return (
                                <tr key={s.student.id} className={`hover:bg-gray-50 transition ${isTop3 ? 'bg-yellow-50/30' : ''}`}>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold text-sm ${
                                            rank === 1 ? 'bg-yellow-400 text-white shadow-md' :
                                            rank === 2 ? 'bg-gray-400 text-white shadow-md' :
                                            rank === 3 ? 'bg-orange-400 text-white shadow-md' :
                                            'text-gray-500 bg-gray-100'
                                        }`}>
                                            {rank}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3 border border-gray-100 shrink-0">
                                                {s.student.avatar ? <img src={s.student.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{s.student.fullName[0]}</div>}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{s.student.fullName}</div>
                                                <div className="text-xs text-gray-500">{s.className}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${isTop3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {s.points}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-full">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-medium text-gray-600">{s.completedTasks}/{s.totalTasks} bài</span>
                                                <span className={`font-bold ${s.progressPercent === 100 ? 'text-green-600' : 'text-blue-600'}`}>{s.progressPercent}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                        s.progressPercent === 100 ? 'bg-green-500' : 
                                                        s.progressPercent > 50 ? 'bg-blue-500' : 
                                                        'bg-yellow-400'
                                                    }`} 
                                                    style={{ width: `${s.progressPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {s.badges.length === 0 ? <span className="text-xs text-gray-300 italic">Chưa có</span> : 
                                                s.badges.map(b => (
                                                    <div key={b} className={`w-8 h-8 rounded-full flex items-center justify-center border ${BADGE_CONFIG[b].color} relative group cursor-help`}>
                                                        <Icon name={BADGE_CONFIG[b].icon} size={14} />
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-gray-800 text-white text-[10px] p-2 rounded shadow-lg z-10 text-center">
                                                            <div className="font-bold mb-1 text-yellow-300">{BADGE_CONFIG[b].label}</div>
                                                            {BADGE_CONFIG[b].desc}
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {sortedStats.length === 0 && (
                <div className="p-10 text-center text-gray-400">
                    <Icon name="users" size={48} className="mx-auto mb-3 opacity-20" />
                    Chưa có dữ liệu cho bộ lọc này.
                </div>
            )}
        </div>
    </div>
  );
};