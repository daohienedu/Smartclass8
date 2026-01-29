import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { ClassInfo } from '../types';
import { Icon } from '../components/Icons';
import { Modal } from '../components/Modal';

export const ClassesManager: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<ClassInfo>>({});

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const data = await provider.classes.list();
    setClasses(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass.id) {
      await provider.classes.update(editingClass.id, editingClass);
    } else {
      await provider.classes.add(editingClass as Omit<ClassInfo, 'id'>);
    }
    setIsModalOpen(false);
    loadClasses();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp này?')) {
      await provider.classes.remove(id);
      loadClasses();
    }
  };

  const openModal = (cls?: ClassInfo) => {
    setEditingClass(cls || { 
      className: '', 
      schoolYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      homeroomTeacher: 'Mrs. Hien',
      schedule: '',
      level: '',
      note: '' 
    });
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Lớp học</h2>
        <button 
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <Icon name="plus" size={18} className="mr-2" /> Thêm lớp
        </button>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="px-6 py-4">Tên lớp</th>
              <th className="px-6 py-4">Năm học</th>
              <th className="px-6 py-4">GVCN</th>
              <th className="px-6 py-4">Lịch học</th>
              <th className="px-6 py-4">Ghi chú</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {classes.map((cls) => (
              <tr key={cls.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{cls.className}</td>
                <td className="px-6 py-4 text-gray-600">{cls.schoolYear}</td>
                <td className="px-6 py-4 text-gray-600">{cls.homeroomTeacher}</td>
                <td className="px-6 py-4 text-gray-600">{cls.schedule}</td>
                <td className="px-6 py-4 text-gray-500 italic text-sm">{cls.note}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(cls)} className="text-blue-600 hover:text-blue-800 font-medium">Sửa</button>
                  <button onClick={() => handleDelete(cls.id)} className="text-red-600 hover:text-red-800 font-medium">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass.id ? 'Cập nhật Lớp học' : 'Thêm Lớp học mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên lớp</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={editingClass.className || ''}
              onChange={(e) => setEditingClass({ ...editingClass, className: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Năm học</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  value={editingClass.schoolYear || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, schoolYear: e.target.value })}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  value={editingClass.level || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, level: e.target.value })}
                />
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GVCN</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={editingClass.homeroomTeacher || ''}
              onChange={(e) => setEditingClass({ ...editingClass, homeroomTeacher: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lịch học</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={editingClass.schedule || ''}
              onChange={(e) => setEditingClass({ ...editingClass, schedule: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              value={editingClass.note || ''}
              onChange={(e) => setEditingClass({ ...editingClass, note: e.target.value })}
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
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};