import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { Document, ClassInfo } from '../types';
import { Icon } from '../components/Icons';
import { Modal } from '../components/Modal';

export const DocumentsManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Document>>({});
  
  // Filter state
  const [filterGrade, setFilterGrade] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [dList, cList] = await Promise.all([
      provider.documents.list(),
      provider.classes.list()
    ]);
    setDocuments(dList);
    setClasses(cList);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem.id) {
        await provider.documents.update(editingItem.id, editingItem);
    } else {
        await provider.documents.add({
            ...editingItem,
            grade: editingItem.grade || '1', // Ensure defaults
            unit: editingItem.unit || 'Unit 1',
            type: editingItem.type || 'link',
            minDuration: editingItem.minDuration || 0,
            createdAt: new Date().toISOString()
        } as Omit<Document, 'id'>);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Xóa tài liệu này?')) {
          await provider.documents.remove(id);
          loadData();
      }
  };

  const openModal = (item?: Document) => {
      setEditingItem(item || {
          title: '',
          url: '',
          category: 'Tài liệu học',
          classId: 'all',
          grade: '1',
          unit: 'Unit 1',
          type: 'link',
          minDuration: 0
      });
      setIsModalOpen(true);
  };

  const getUnits = (grade?: string) => {
      const g = grade || '1';
      const maxUnits = (g === '1' || g === '2') ? 16 : 20;
      return Array.from({ length: maxUnits }, (_, i) => `Unit ${i + 1}`);
  };

  // Safe compare
  const filteredDocs = documents.filter(d => filterGrade === 'all' || String(d.grade) === filterGrade);

  const getTypeIcon = (type?: string) => {
      if (type === 'video') return 'camera';
      if (type === 'pdf') return 'file';
      return 'link';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Kho Tài liệu</h2>
        
        <div className="flex space-x-2">
            <select 
                className="px-3 py-2 border rounded-lg text-sm bg-gray-50"
                value={filterGrade}
                onChange={e => setFilterGrade(e.target.value)}
            >
                <option value="all">Tất cả Khối</option>
                {[1,2,3,4,5].map(g => <option key={g} value={String(g)}>Khối {g}</option>)}
            </select>

            <button 
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
            <Icon name="plus" size={18} className="mr-2" /> Thêm tài liệu
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0">
            <tr>
              <th className="px-6 py-4">Tên tài liệu</th>
              <th className="px-6 py-4">Loại</th>
              <th className="px-6 py-4">Vị trí</th>
              <th className="px-6 py-4">Phạm vi</th>
              <th className="px-6 py-4">Yêu cầu</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDocs.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                    <Icon name={getTypeIcon(item.type)} className="mr-2 text-gray-400" size={16} />
                    <div className="truncate max-w-xs">{item.title}</div>
                </td>
                <td className="px-6 py-4 capitalize text-sm text-gray-600">{item.type || 'link'}</td>
                <td className="px-6 py-4 text-gray-600">
                    {item.grade ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            Khối {item.grade} &gt; {item.unit}
                        </span>
                    ) : <span className="text-gray-400 text-xs">-</span>}
                </td>
                <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {item.classId === 'all' ? 'Công khai' : classes.find(c => c.id === item.classId)?.className}
                    </span>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                    {item.minDuration ? `${item.minDuration}s` : 'Không'}
                </td>
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
        title={editingItem.id ? 'Sửa tài liệu' : 'Thêm tài liệu mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài liệu</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại tài liệu</label>
                    <select
                         className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                         value={editingItem.type || 'link'}
                         onChange={e => setEditingItem({...editingItem, type: e.target.value as any})}
                    >
                        <option value="link">Liên kết ngoài</option>
                        <option value="video">Video (Youtube)</option>
                        <option value="pdf">PDF (Nhúng)</option>
                    </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian xem tối thiểu (giây)</label>
                     <input
                        type="number"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingItem.minDuration || 0}
                        onChange={e => setEditingItem({...editingItem, minDuration: Number(e.target.value)})}
                        placeholder="0 = Không yêu cầu"
                     />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khối (Grade)</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingItem.grade || '1'}
                        onChange={e => setEditingItem({...editingItem, grade: e.target.value, unit: 'Unit 1'})}
                    >
                        {[1,2,3,4,5].map(g => <option key={g} value={String(g)}>Khối {g}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bài (Unit)</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingItem.unit || 'Unit 1'}
                        onChange={e => setEditingItem({...editingItem, unit: e.target.value})}
                    >
                        {getUnits(editingItem.grade).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                    <input
                        type="text"
                        list="categories"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingItem.category}
                        onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                    />
                    <datalist id="categories">
                        <option value="Tài liệu học" />
                        <option value="Nội quy" />
                        <option value="Biểu mẫu" />
                        <option value="Kế hoạch" />
                    </datalist>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phạm vi</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingItem.classId}
                        onChange={e => setEditingItem({...editingItem, classId: e.target.value})}
                    >
                        <option value="all">Công khai (Tất cả)</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn (URL) hoặc Mã nhúng (Iframe)</label>
                <input
                    type="text"
                    required
                    placeholder={editingItem.type === 'video' ? "https://youtu.be/... hoặc <iframe..." : "https://..."}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    value={editingItem.url}
                    onChange={e => {
                        let val = e.target.value;
                        
                        // Auto-extract src from iframe
                        const srcMatch = val.match(/src=["'](.*?)["']/);
                        if (srcMatch && srcMatch[1]) {
                            val = srcMatch[1];
                        }

                        let newType = editingItem.type;
                        // If type is not set or is link, try to detect
                        if (!newType || newType === 'link') {
                             if (val.includes('youtu')) newType = 'video';
                             else if (val.toLowerCase().endsWith('.pdf')) newType = 'pdf';
                        }
                        
                        setEditingItem({...editingItem, url: val, type: newType});
                    }}
                />
                {editingItem.type === 'video' && <p className="text-xs text-gray-500 mt-1">Hỗ trợ link Youtube hoặc mã nhúng (Embed Code).</p>}
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