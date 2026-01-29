import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { ClassInfo, Student, Behavior } from '../types';
import { Icon } from '../components/Icons';
import { Modal } from '../components/Modal';

export const BehaviorManager: React.FC = () => {
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [filterClass, setFilterClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBehavior, setEditingBehavior] = useState<Partial<Behavior>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [bList, cList, sList] = await Promise.all([
      provider.behaviors.list(),
      provider.classes.list(),
      provider.students.list()
    ]);
    setBehaviors(bList);
    setClasses(cList);
    setStudents(sList);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBehavior.id) {
        await provider.behaviors.update(editingBehavior.id, editingBehavior);
    } else {
        await provider.behaviors.add(editingBehavior as Omit<Behavior, 'id'>);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('Xóa ghi nhận này?')) {
        await provider.behaviors.remove(id);
        loadData();
    }
  };

  const openModal = (b?: Behavior) => {
    if (b) {
        setEditingBehavior(b);
    } else {
        // Default new behavior
        setEditingBehavior({
            studentId: students.length > 0 ? students[0].id : '',
            type: 'PRAISE',
            date: new Date().toISOString().split('T')[0],
            points: 1,
            content: ''
        });
    }
    setIsModalOpen(true);
  };

  const filteredBehaviors = behaviors.filter(b => {
      if (filterClass === 'all') return true;
      const student = students.find(s => s.id === b.studentId);
      return student && student.classId === filterClass;
  });

  const formatDateDisplay = (isoDate: string) => {
      if (!isoDate) return '';
      const parts = isoDate.split('T')[0].split('-');
      if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDate;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Nề nếp</h2>
        <div className="flex space-x-4">
            <select 
                className="px-3 py-2 border rounded-lg text-sm"
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
            >
                <option value="all">Tất cả các lớp</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
            </select>
            <button 
                onClick={() => openModal()}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
                <Icon name="plus" size={18} className="mr-2" /> Thêm mới
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
          {loading ? (
              <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
          ) : (
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0">
                    <tr>
                        <th className="px-6 py-4">Thời gian</th>
                        <th className="px-6 py-4">Học sinh</th>
                        <th className="px-6 py-4">Loại</th>
                        <th className="px-6 py-4">Nội dung</th>
                        <th className="px-6 py-4 text-center">Điểm</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredBehaviors.map(b => {
                        const student = students.find(s => s.id === b.studentId);
                        return (
                            <tr key={b.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-600 text-sm">{formatDateDisplay(b.date)}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {student?.fullName || 'Unknown'}
                                    <div className="text-xs text-gray-400">
                                        {classes.find(c => c.id === student?.classId)?.className}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${b.type === 'PRAISE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {b.type === 'PRAISE' ? 'Khen ngợi' : 'Nhắc nhở'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-800">{b.content}</td>
                                <td className="px-6 py-4 text-center font-bold text-gray-700">
                                    {b.type === 'PRAISE' ? '+' : ''}{b.points}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => openModal(b)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Sửa</button>
                                    <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBehavior.id ? 'Sửa ghi nhận' : 'Thêm ghi nhận mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Học sinh</label>
                <select 
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    value={editingBehavior.studentId}
                    onChange={e => setEditingBehavior({...editingBehavior, studentId: e.target.value})}
                    disabled={!!editingBehavior.id} // Disable changing student on edit to avoid complex point recalc logic bugs for now
                >
                    {students.map(s => (
                        <option key={s.id} value={s.id}>{s.fullName} - {classes.find(c => c.id === s.classId)?.className}</option>
                    ))}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                    <select 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingBehavior.type}
                        onChange={e => setEditingBehavior({...editingBehavior, type: e.target.value as any})}
                    >
                        <option value="PRAISE">Khen ngợi (Điểm cộng)</option>
                        <option value="WARN">Nhắc nhở (Điểm trừ/0)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                    <input 
                        type="date"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingBehavior.date?.split('T')[0]}
                        onChange={e => setEditingBehavior({...editingBehavior, date: e.target.value})}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điểm số</label>
                <input 
                    type="number"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    value={editingBehavior.points}
                    onChange={e => setEditingBehavior({...editingBehavior, points: Number(e.target.value)})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                <textarea 
                    required
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    value={editingBehavior.content}
                    onChange={e => setEditingBehavior({...editingBehavior, content: e.target.value})}
                    placeholder="Ví dụ: Làm bài tập đầy đủ..."
                />
            </div>
            <div className="flex justify-end pt-4">
                <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mr-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                    Lưu
                </button>
            </div>
        </form>
      </Modal>
    </div>
  );
};