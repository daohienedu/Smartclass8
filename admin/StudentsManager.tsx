import React, { useEffect, useState, useRef } from 'react';
import { provider } from '../core/provider';
import { Student, ClassInfo, Parent } from '../types';
import { Icon } from '../components/Icons';
import { Modal } from '../components/Modal';
import * as XLSX from 'xlsx';

// Extend partial for form state
interface EditingStudentState extends Partial<Student> {
    accountUsername?: string;
    accountPassword?: string;
}

const normalizeString = (str: string) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};

export const StudentsManager: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<EditingStudentState>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [sList, cList, pList] = await Promise.all([
      provider.students.list(),
      provider.classes.list(),
      provider.parents.list()
    ]);
    setStudents(sList);
    setClasses(cList);
    setParents(pList);
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('Xóa học sinh này?')) {
      await provider.students.remove(id);
      loadData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let savedStudent: Student;

    try {
        // 1. Save Student Info
        if(editingStudent.id) {
            savedStudent = await provider.students.update(editingStudent.id, editingStudent);
        } else {
            savedStudent = await provider.students.add(editingStudent as Omit<Student, 'id'>);
        }

        // 2. Create Account Logic
        // Auto-generate credentials if not provided
        let finalUsername = editingStudent.accountUsername;
        let finalPassword = editingStudent.accountPassword;

        if (!finalUsername) {
            finalUsername = normalizeString(savedStudent.fullName);
        }
        if (!finalPassword) {
            finalPassword = '123';
        }

        // Attempt to register account
        if (finalUsername && finalPassword) {
            try {
                await provider.auth.register({
                    username: finalUsername,
                    password: finalPassword,
                    fullName: savedStudent.fullName,
                    role: 'student',
                    relatedId: savedStudent.id
                });
                if (!editingStudent.id) {
                     alert(`Đã thêm học sinh và tạo tài khoản: ${finalUsername} / ${finalPassword}`);
                }
            } catch (err: any) {
                // If creating a new student and account exists, warn user
                if (!editingStudent.id) {
                    console.warn(err);
                    alert(`Đã thêm học sinh. Lưu ý: Không tạo được tài khoản (Có thể tên đăng nhập '${finalUsername}' đã tồn tại).`);
                }
            }
        }

        setIsModalOpen(false);
        loadData();
    } catch (error) {
        alert('Có lỗi xảy ra khi lưu dữ liệu.');
    }
  };

  const openModal = (student?: Student) => {
    setEditingStudent(student || {
      fullName: '',
      classId: classes[0]?.id || '',
      dob: '',
      gender: 'Male',
      address: '',
      status: 'Active',
      points: 0,
      parentId: parents[0]?.id || '',
      avatar: '',
      accountUsername: '',
      accountPassword: ''
    });
    setIsModalOpen(true);
  };

  const filteredStudents = students.filter(s => {
    const matchClass = filterClass === 'all' || s.classId === filterClass;
    const matchSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSearch;
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setEditingStudent({ ...editingStudent, avatar: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  // --- Excel Features ---

  // 1. Template for Import
  const handleDownloadTemplate = () => {
      const headers = ['Họ và tên', 'Ngày sinh (dd/mm/yyyy)', 'Giới tính', 'Địa chỉ', 'Phụ huynh', 'SĐT', 'Email', 'Quan hệ', 'Username', 'Password'];
      const sampleData = [
          ['Nguyễn Văn An', '15/05/2015', 'Nam', '123 Đường Láng', 'Nguyễn Văn Bình', '0912345678', 'binh@example.com', 'Father', '', ''],
          ['Trần Thị Chi', '20/08/2016', 'Nữ', '456 Cầu Giấy', 'Lê Thị Dung', '0987654321', '', 'Mother', '', '']
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      const wscols = headers.map(() => ({ wch: 15 }));
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Hoc_Sinh");
      XLSX.writeFile(wb, "Mau_Nhap_Hoc_Sinh_Co_TK.xlsx");
  };

  // 2. Export Account List (Credentials)
  const handleExportCredentials = () => {
      const headers = ['Lớp', 'Họ và tên', 'Ngày sinh', 'Tên đăng nhập', 'Mật khẩu'];
      const data = filteredStudents.map(s => {
          const clsName = classes.find(c => c.id === s.classId)?.className || '';
          
          // Generate credentials logic matching the creation rule
          const suggestedUsername = normalizeString(s.fullName);
          const defaultPassword = '123'; 
          
          return [
              clsName,
              s.fullName,
              formatDateDisplay(s.dob),
              suggestedUsername,
              defaultPassword
          ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      ws['!cols'] = [{wch: 10}, {wch: 25}, {wch: 15}, {wch: 20}, {wch: 20}];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Tai_Khoan");
      XLSX.writeFile(wb, `DS_Tai_Khoan_${filterClass}.xlsx`);
  };

  const parseImportDate = (val: any): string => {
      if (!val) return '2015-01-01';
      const str = String(val).trim();
      if (str.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          const [d, m, y] = str.split('/');
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      return str;
  };

  const handleImportClick = () => {
      if (filterClass === 'all') {
          alert('Vui lòng chọn một Lớp cụ thể trong bộ lọc để nhập danh sách vào lớp đó.');
          return;
      }
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
          let accountCount = 0;

          for (const row of data as any[]) {
              try {
                  const newParent = await provider.parents.add({
                      fullName: row['ParentName'] || row['Phụ huynh'] || 'Phụ huynh HS',
                      phone: row['Phone'] || row['SĐT'] || '',
                      email: row['Email'] || '',
                      relationship: (row['Relationship'] || row['Quan hệ'] || 'Mother') as any,
                  });

                  const rawDob = row['DOB'] || row['Ngày sinh'] || row['Ngày sinh (dd/mm/yyyy)'] || '15/05/2015';
                  
                  const newStudent = await provider.students.add({
                      classId: filterClass,
                      fullName: row['FullName'] || row['Họ và tên'] || 'Unknown',
                      dob: parseImportDate(rawDob),
                      gender: (row['Gender'] === 'Nữ' || row['Giới tính'] === 'Nữ' || row['Gender'] === 'Female') ? 'Female' : 'Male',
                      address: row['Address'] || row['Địa chỉ'] || '',
                      parentId: newParent.id,
                      status: 'Active',
                      points: 0
                  });
                  successCount++;

                  // Auto register account
                  let user = row['Username'] || row['Tên đăng nhập'];
                  let pass = row['Password'] || row['Mật khẩu'];
                  
                  // Auto-generate if missing
                  if (!user) user = normalizeString(newStudent.fullName);
                  if (!pass) pass = '123';

                  if (user && pass) {
                      try {
                          await provider.auth.register({
                              username: String(user),
                              password: String(pass),
                              fullName: newStudent.fullName,
                              role: 'student',
                              relatedId: newStudent.id
                          });
                          accountCount++;
                      } catch (e) {
                          console.warn('Failed to create account for imported student', e);
                      }
                  }

              } catch (err) {
                  console.error('Error importing row', row, err);
              }
          }
          alert(`Đã nhập ${successCount} học sinh. Đã tạo ${accountCount} tài khoản đăng nhập.`);
          loadData();
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
  };

  const formatDateDisplay = (isoDate?: string) => {
      if (!isoDate) return '';
      const parts = isoDate.split('-');
      if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDate;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Học sinh</h2>
        <div className="flex space-x-2 flex-1 justify-end items-center">
          <input 
            type="text" 
            placeholder="Tìm kiếm tên..." 
            className="px-3 py-2 border rounded-lg text-sm hidden md:block"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select 
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
          >
            <option value="all">Tất cả các lớp</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
          </select>
          
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />

          {/* New Export Button for Credentials */}
          <button onClick={handleExportCredentials} className="flex items-center px-3 py-2 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg hover:bg-purple-100 transition whitespace-nowrap" title="Xuất danh sách tài khoản cho học sinh">
             <Icon name="file" size={18} className="md:mr-2" /> <span className="hidden md:inline">Xuất DS TK</span>
          </button>

          <button onClick={handleDownloadTemplate} className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition whitespace-nowrap" title="Tải file mẫu Excel">
             <Icon name="download" size={18} className="md:mr-2" /> <span className="hidden md:inline">Tải mẫu</span>
          </button>

          <button onClick={handleImportClick} className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition whitespace-nowrap" title="Nhập từ Excel">
             <Icon name="upload" size={18} className="md:mr-2" /> <span className="hidden md:inline">Nhập Excel</span>
          </button>

          <button onClick={() => openModal()} className="flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition whitespace-nowrap">
            <Icon name="plus" size={18} className="md:mr-2" /> <span className="hidden md:inline">Thêm mới</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">Học sinh</th>
              <th className="px-6 py-4">Lớp / Ngày sinh</th>
              <th className="px-6 py-4">Địa chỉ / Giới tính</th>
              <th className="px-6 py-4">Phụ huynh</th>
              <th className="px-6 py-4 text-center">Trạng thái / Điểm</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map((student) => {
              const className = classes.find(c => c.id === student.classId)?.className || 'Unknown';
              const parent = parents.find(p => p.id === student.parentId);
              return (
                <tr key={student.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4">
                      <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3 shrink-0">
                                {student.avatar ? (
                                    <img src={student.avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-gray-500">{student.fullName.charAt(0)}</span>
                                )}
                          </div>
                          <div>
                              <div className="font-medium text-gray-900">{student.fullName}</div>
                              <div className="text-xs text-gray-400 font-mono">#{student.id}</div>
                          </div>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800">{className}</div>
                      <div className="text-xs text-gray-500">{formatDateDisplay(student.dob)}</div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 truncate max-w-[150px]" title={student.address}>{student.address}</div>
                      <div className="text-xs text-gray-500">{student.gender === 'Male' ? 'Nam' : 'Nữ'}</div>
                  </td>
                  <td className="px-6 py-4">
                      {parent ? (
                          <>
                            <div className="text-sm font-medium text-gray-800">{parent.fullName} <span className="text-xs font-normal text-gray-500">({parent.relationship === 'Father' ? 'Bố' : parent.relationship === 'Mother' ? 'Mẹ' : 'GH'})</span></div>
                            <div className="text-xs text-blue-600">{parent.phone}</div>
                          </>
                      ) : (
                          <span className="text-xs text-red-400 italic">Chưa cập nhật</span>
                      )}
                  </td>
                  <td className="px-6 py-4 text-center">
                     <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {student.status === 'Active' ? 'Đang học' : 'Nghỉ học'}
                     </div>
                     <div className="text-xs font-bold text-yellow-600">{student.points} sao</div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(student)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Sửa</button>
                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Xóa</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent.id ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Avatar Section */}
          <div className="flex justify-center mb-6">
              <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                      {editingStudent.avatar ? (
                          <img src={editingStudent.avatar} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                          <Icon name="image" size={32} className="text-gray-300" />
                      )}
                  </div>
                  <button 
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-emerald-600 rounded-full text-white hover:bg-emerald-700 transition shadow-sm"
                  >
                      <Icon name="camera" size={16} />
                  </button>
                  <input 
                      type="file" 
                      ref={avatarInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                  />
              </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={editingStudent.fullName || ''}
              onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  value={editingStudent.dob || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  value={editingStudent.gender || 'Male'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as any })}
                >
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                </select>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lớp học</label>
              <select
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={editingStudent.classId || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, classId: e.target.value })}
              >
                <option value="" disabled>Chọn lớp</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={editingStudent.status || 'Active'}
                onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value as any })}
              >
                <option value="Active">Đang học</option>
                <option value="Inactive">Nghỉ học</option>
                <option value="Suspended">Đình chỉ</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={editingStudent.address || ''}
              onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phụ huynh liên hệ</label>
            <select
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={editingStudent.parentId || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, parentId: e.target.value })}
              >
                <option value="" disabled>Chọn phụ huynh</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>)}
              </select>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                  <Icon name="users" className="mr-2" size={16}/> Tài khoản đăng nhập
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Tên đăng nhập</label>
                      <input 
                          type="text" 
                          placeholder={editingStudent.fullName ? normalizeString(editingStudent.fullName) : "Tự động tạo từ tên"}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          value={editingStudent.accountUsername || ''}
                          onChange={e => setEditingStudent({...editingStudent, accountUsername: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Mật khẩu</label>
                      <input 
                          type="text" 
                          placeholder="Mặc định: 123"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          value={editingStudent.accountPassword || ''}
                          onChange={e => setEditingStudent({...editingStudent, accountPassword: e.target.value})}
                      />
                  </div>
                  <div className="col-span-2 text-xs text-gray-500 italic">
                      * Nếu để trống, hệ thống sẽ tự động tạo tài khoản (Tên viết liền không dấu / MK: 123).
                  </div>
              </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
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