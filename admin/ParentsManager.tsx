import React, { useEffect, useState, useRef } from 'react';
import { provider } from '../core/provider';
import { Parent } from '../types';
import { Icon } from '../components/Icons';
import { Modal } from '../components/Modal';
import * as XLSX from 'xlsx';

export const ParentsManager: React.FC = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Partial<Parent>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await provider.parents.list();
    setParents(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingParent.id) {
      await provider.parents.update(editingParent.id, editingParent);
    } else {
      await provider.parents.add(editingParent as Omit<Parent, 'id'>);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
      await provider.parents.remove(id);
      loadData();
    }
  };

  const openModal = (p?: Parent) => {
    setEditingParent(p || {
      fullName: '',
      phone: '',
      email: '',
      relationship: 'Mother',
      studentId: ''
    });
    setIsModalOpen(true);
  };

  // --- Excel Handling Features ---

  const handleDownloadTemplate = () => {
      const headers = ['Họ và tên', 'Số điện thoại', 'Email', 'Quan hệ'];
      const sampleData = [
          ['Nguyễn Văn Bình', '0912345678', 'binh@example.com', 'Father'],
          ['Lê Thị Dung', '0987654321', '', 'Mother'],
          ['Trần Văn Cường', '0909000111', '', 'Guardian']
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      
      // Set column widths
      const wscols = [
          { wch: 25 }, // Name
          { wch: 15 }, // Phone
          { wch: 25 }, // Email
          { wch: 15 }, // Relationship
      ];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Phu_Huynh");
      XLSX.writeFile(wb, "Mau_Nhap_Phu_Huynh.xlsx");
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          if (data.length === 0) {
              alert('File Excel không có dữ liệu.');
              return;
          }

          let successCount = 0;

          for (const row of data as any[]) {
              try {
                  // Map Vietnamese terms to Enum if necessary
                  let rel = row['Quan hệ'] || row['Relationship'] || 'Other';
                  const relLower = String(rel).toLowerCase();
                  if (relLower === 'bố' || relLower === 'cha' || relLower === 'father') rel = 'Father';
                  else if (relLower === 'mẹ' || relLower === 'má' || relLower === 'mother') rel = 'Mother';
                  else if (relLower.includes('giám hộ') || relLower === 'guardian') rel = 'Guardian';
                  else rel = 'Other';

                  await provider.parents.add({
                      fullName: row['Họ và tên'] || row['FullName'] || 'Unknown Parent',
                      phone: row['Số điện thoại'] || row['Phone'] || '',
                      email: row['Email'] || '',
                      relationship: rel as any,
                  });
                  successCount++;
              } catch (err) {
                  console.error('Error importing row', row, err);
              }
          }

          alert(`Đã thêm thành công ${successCount} phụ huynh.`);
          loadData();
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Phụ huynh</h2>
        <div className="flex space-x-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx, .xls" 
                className="hidden" 
            />
            
            <button 
                onClick={handleDownloadTemplate}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition whitespace-nowrap"
                title="Tải file mẫu Excel"
            >
                <Icon name="download" size={18} className="md:mr-2" /> <span className="hidden md:inline">Tải mẫu</span>
            </button>

            <button 
                onClick={handleImportClick}
                className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition whitespace-nowrap"
                title="Nhập từ Excel"
            >
                <Icon name="upload" size={18} className="md:mr-2" /> <span className="hidden md:inline">Nhập Excel</span>
            </button>

            <button 
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition whitespace-nowrap"
            >
            <Icon name="plus" size={18} className="md:mr-2" /> <span className="hidden md:inline">Thêm mới</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0">
            <tr>
              <th className="px-6 py-4">Họ và tên</th>
              <th className="px-6 py-4">Số điện thoại</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Quan hệ</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {parents.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{p.fullName}</td>
                <td className="px-6 py-4 text-gray-600">{p.phone}</td>
                <td className="px-6 py-4 text-gray-600">{p.email}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {p.relationship}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Sửa</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingParent.id ? 'Cập nhật Phụ huynh' : 'Thêm Phụ huynh'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={editingParent.fullName || ''}
              onChange={(e) => setEditingParent({ ...editingParent, fullName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={editingParent.phone || ''}
                onChange={(e) => setEditingParent({ ...editingParent, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quan hệ</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={editingParent.relationship || 'Mother'}
                onChange={(e) => setEditingParent({ ...editingParent, relationship: e.target.value as any })}
              >
                <option value="Father">Bố</option>
                <option value="Mother">Mẹ</option>
                <option value="Guardian">Người giám hộ</option>
                <option value="Other">Khác</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={editingParent.email || ''}
              onChange={(e) => setEditingParent({ ...editingParent, email: e.target.value })}
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