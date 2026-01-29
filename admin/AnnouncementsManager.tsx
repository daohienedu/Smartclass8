import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { Announcement, ClassInfo } from '../types';
import { Icon } from '../components/Icons';
import { Modal } from '../components/Modal';

export const AnnouncementsManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Announcement>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [aList, cList] = await Promise.all([
      provider.announcements.list(),
      provider.classes.list()
    ]);
    setAnnouncements(aList);
    setClasses(cList);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem.id) {
        await provider.announcements.update(editingItem.id, editingItem);
    } else {
        await provider.announcements.add({
            ...editingItem,
            author: 'Admin',
            createdAt: new Date().toISOString()
        } as Omit<Announcement, 'id'>);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Xóa thông báo này?')) {
          await provider.announcements.remove(id);
          loadData();
      }
  };

  const handleTogglePin = async (item: Announcement) => {
      await provider.announcements.update(item.id, { pinned: !item.pinned });
      loadData();
  };

  const openModal = (item?: Announcement) => {
      setEditingItem(item || {
          title: '',
          content: '',
          classId: 'all',
          target: 'all',
          date: new Date().toISOString().split('T')[0],
          pinned: false
      });
      setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Thông báo</h2>
        <button 
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <Icon name="plus" size={18} className="mr-2" /> Soạn thông báo
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0">
            <tr>
              <th className="px-6 py-4">Ghim</th>
              <th className="px-6 py-4">Tiêu đề</th>
              <th className="px-6 py-4">Gửi đến</th>
              <th className="px-6 py-4">Đối tượng</th>
              <th className="px-6 py-4">Ngày</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {announcements.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                    <button 
                        onClick={() => handleTogglePin(item)}
                        className={`transition ${item.pinned ? 'text-orange-500 transform scale-110' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                        <Icon name="pin" size={18} />
                    </button>
                </td>
                <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{item.content}</div>
                </td>
                <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {item.classId === 'all' ? 'Toàn trường' : classes.find(c => c.id === item.classId)?.className}
                    </span>
                </td>
                <td className="px-6 py-4 capitalize text-sm text-gray-600">{item.target}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(item)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Sửa</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem.id ? 'Sửa thông báo' : 'Soạn thông báo mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    value={editingItem.title}
                    onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gửi đến lớp</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingItem.classId}
                        onChange={e => setEditingItem({...editingItem, classId: e.target.value})}
                    >
                        <option value="all">Toàn trường (Tất cả)</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingItem.target}
                        onChange={e => setEditingItem({...editingItem, target: e.target.value as any})}
                    >
                        <option value="all">Tất cả</option>
                        <option value="student">Học sinh</option>
                        <option value="parent">Phụ huynh</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    value={editingItem.content}
                    onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                />
            </div>
            <div className="flex items-center space-x-2">
                 <input 
                    type="checkbox"
                    id="pinned"
                    checked={editingItem.pinned}
                    onChange={e => setEditingItem({...editingItem, pinned: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                 />
                 <label htmlFor="pinned" className="text-sm text-gray-700 font-medium">Ghim lên đầu bảng tin</label>
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