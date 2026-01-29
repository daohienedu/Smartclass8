import React, { useEffect, useState, useRef } from 'react';
import { provider } from '../core/provider';
import { Task, ClassInfo, Student, TaskReply } from '../types';
import { Icon } from '../components/Icons';
import { Modal } from '../components/Modal';

interface Attachment {
    type: 'file' | 'link' | 'pdf' | 'quiz';
    url: string;
    name: string;
}

export const TasksManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task>>({});
  
  // Attachments State
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachType, setAttachType] = useState<'file' | 'pdf' | 'quiz' | 'link'>('file');
  const [attachInput, setAttachInput] = useState('');
  const [attachName, setAttachName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View Reply State
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [taskReplies, setTaskReplies] = useState<TaskReply[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  useEffect(() => {
    const loadInit = async () => {
        setLoading(true);
        const cList = await provider.classes.list();
        setClasses(cList);
        // Pass cList directly to avoid state update delay issues
        await loadTasks(cList);
        setLoading(false);
    };
    loadInit();
  }, []);

  useEffect(() => {
    if (classes.length > 0) {
        loadTasks(classes);
    }
  }, [selectedClassId, filterGrade]);

  const loadTasks = async (currentClasses: ClassInfo[] = classes) => {
    setLoading(true);
    try {
        let data: Task[] = [];
        
        if (selectedClassId === 'all') {
            // 1. Fetch Global Tasks
            const globalTasks = await provider.tasks.list('all');
            data = [...globalTasks];

            // 2. Fetch Tasks for ALL classes in parallel to aggregate EVERYTHING
            if (currentClasses.length > 0) {
                const promises = currentClasses.map(c => provider.tasks.list(c.id));
                const results = await Promise.all(promises);
                results.forEach(res => {
                    data = [...data, ...res];
                });
            }

            // 3. Deduplicate (Just in case)
            data = Array.from(new Map(data.map(item => [item.id, item])).values());
        } else {
            // Fetch single class
            data = await provider.tasks.list(selectedClassId);
        }

        // Filter by Grade if selected
        if (filterGrade !== 'all') {
            data = data.filter(t => t.grade === filterGrade);
        }

        // Sort: Newest first
        data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setTasks(data);
    } catch (error) {
        console.error("Error loading tasks:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Serialize attachments to string[] for backend compatibility
    const attachmentsPayload = attachments.map(a => JSON.stringify(a));

    const payload = {
        ...editingTask,
        attachments: attachmentsPayload
    };

    if (editingTask.id) {
        await provider.tasks.update(editingTask.id, payload);
    } else {
        await provider.tasks.add({
            ...payload,
            createdAt: new Date().toISOString()
        } as Omit<Task, 'id'>);
    }
    setIsModalOpen(false);
    loadTasks();
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Xóa bài tập này?')) {
          await provider.tasks.remove(id);
          loadTasks();
      }
  };

  // Helper to parse existing attachments for display in list
  const parseAttachmentsSafe = (jsonList?: any) => {
      if (!jsonList) return [];
      let list = jsonList;
      
      // Handle stringified JSON array
      if (typeof list === 'string') {
          try {
              list = JSON.parse(list);
          } catch {
              return [];
          }
      }

      if (!Array.isArray(list)) return [];

      return list.map((s: any) => {
          if (typeof s === 'object' && s !== null) return s as Attachment;
          try { return JSON.parse(s) as Attachment; } catch { return null; }
      }).filter((x: any): x is Attachment => !!x);
  };

  const openEditModal = (task?: Task) => {
      setEditingTask(task || {
          title: '',
          description: '',
          classId: selectedClassId === 'all' ? classes[0]?.id || 'all' : selectedClassId,
          dueDate: new Date().toISOString().split('T')[0],
          requireReply: true,
          grade: filterGrade !== 'all' ? filterGrade : '1',
          unit: 'Unit 1'
      });
      
      // Parse attachments robustly
      if (task && task.attachments) {
          const parsed = parseAttachmentsSafe(task.attachments);
          setAttachments(parsed);
      } else {
          setAttachments([]);
      }
      
      // Reset attachment inputs
      setAttachType('file');
      setAttachInput('');
      setAttachName('');
      setIsModalOpen(true);
  };

  const openRepliesModal = async (task: Task) => {
      setViewingTask(task);
      const [replies, students] = await Promise.all([
          provider.tasks.getReplies(task.id),
          provider.students.list()
      ]);
      setTaskReplies(replies);
      
      if (task.classId === 'all') {
         setClassStudents(students);
      } else {
         setClassStudents(students.filter(s => s.classId === task.classId));
      }
      setIsReplyModalOpen(true);
  };

  const getUnits = (grade?: string) => {
      const g = grade || '1';
      const maxUnits = (g === '1' || g === '2') ? 16 : 20;
      return Array.from({ length: maxUnits }, (_, i) => `Unit ${i + 1}`);
  };

  // Attachment Logic
  const handleAddAttachment = () => {
      if (attachType !== 'file' && !attachInput) return;
      
      const newAtt: Attachment = {
          type: attachType,
          url: attachInput,
          name: attachName || (attachType === 'file' ? 'File đính kèm' : 'Link đính kèm')
      };
      setAttachments([...attachments, newAtt]);
      setAttachInput('');
      setAttachName('');
  };

  const handleRemoveAttachment = (idx: number) => {
      setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = () => {
              const base64 = reader.result as string;
              setAttachments([...attachments, {
                  type: 'file',
                  url: base64,
                  name: file.name
              }]);
          };
          reader.readAsDataURL(file);
      }
  };

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
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Quản lý Bài tập / Nhắc việc</h2>
            <div className="mt-2 flex space-x-2">
                <select 
                    className="px-3 py-1 border rounded-lg text-sm bg-gray-50"
                    value={filterGrade}
                    onChange={e => setFilterGrade(e.target.value)}
                >
                    <option value="all">Tất cả Khối</option>
                    {[1,2,3,4,5].map(g => <option key={g} value={String(g)}>Khối {g}</option>)}
                </select>

                <select 
                    className="px-3 py-1 border rounded-lg text-sm bg-gray-50"
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                >
                    <option value="all">Tất cả Lớp (Tổng hợp)</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                </select>
            </div>
        </div>
        <button 
          onClick={() => openEditModal()}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <Icon name="plus" size={18} className="mr-2" /> Tạo bài tập
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
            <div className="flex justify-center items-center h-full text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
                Đang tải dữ liệu...
            </div>
        ) : (
            <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm sticky top-0">
                <tr>
                <th className="px-6 py-4">Bài tập</th>
                <th className="px-6 py-4">Đính kèm</th>
                <th className="px-6 py-4">Vị trí</th>
                <th className="px-6 py-4">Phạm vi</th>
                <th className="px-6 py-4">Hạn nộp</th>
                <th className="px-6 py-4 text-center">Yêu cầu nộp</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {tasks.map((item) => {
                    const atts = parseAttachmentsSafe(item.attachments);
                    return (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{item.title}</div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                        </td>
                        <td className="px-6 py-4">
                            {atts.length > 0 ? (
                                <div className="flex -space-x-1">
                                    {atts.map((a, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs text-gray-600" title={a.name}>
                                            <Icon name={a.type === 'pdf' ? 'file' : a.type === 'quiz' ? 'form' : 'link'} size={12} />
                                        </div>
                                    ))}
                                </div>
                            ) : <span className="text-gray-300 text-xs">-</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                            {item.grade ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                    Khối {item.grade} &gt; {item.unit}
                                </span>
                            ) : <span className="text-gray-400 text-xs">-</span>}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${item.classId === 'all' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                {item.classId === 'all' ? 'Toàn trường' : classes.find(c => c.id === item.classId)?.className || item.classId}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDateDisplay(item.dueDate)}</td>
                        <td className="px-6 py-4 text-center">
                            {item.requireReply ? (
                                <button onClick={() => openRepliesModal(item)} className="text-blue-600 hover:underline text-sm font-bold">
                                    Xem phản hồi
                                </button>
                            ) : (
                                <span className="text-gray-400 text-sm">Không</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Sửa</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Xóa</button>
                        </td>
                    </tr>
                    );
                })}
                {tasks.length === 0 && (
                    <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">Chưa có bài tập nào được tạo.</td>
                    </tr>
                )}
            </tbody>
            </table>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask.id ? 'Sửa bài tập' : 'Tạo bài tập mới'}
      >
        <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    value={editingTask.title}
                    onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khối (Grade)</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingTask.grade}
                        onChange={e => setEditingTask({...editingTask, grade: e.target.value, unit: 'Unit 1'})}
                    >
                        {[1,2,3,4,5].map(g => <option key={g} value={String(g)}>Khối {g}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bài (Unit)</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingTask.unit}
                        onChange={e => setEditingTask({...editingTask, unit: e.target.value})}
                    >
                        {getUnits(editingTask.grade).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giao cho Lớp</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingTask.classId}
                        onChange={e => setEditingTask({...editingTask, classId: e.target.value})}
                    >
                        <option value="all">Toàn trường / Chung</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp</label>
                    <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        value={editingTask.dueDate?.split('T')[0]}
                        onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})}
                    />
                </div>
            </div>

            {/* Attachments Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-3">Tài liệu / Nội dung đính kèm</label>
                
                {/* Type Selection Tabs */}
                <div className="flex space-x-2 mb-3">
                    <button type="button" onClick={() => setAttachType('file')} className={`px-3 py-1 text-xs rounded-full font-bold transition ${attachType === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Tải File</button>
                    <button type="button" onClick={() => setAttachType('pdf')} className={`px-3 py-1 text-xs rounded-full font-bold transition ${attachType === 'pdf' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Link PDF</button>
                    <button type="button" onClick={() => setAttachType('quiz')} className={`px-3 py-1 text-xs rounded-full font-bold transition ${attachType === 'quiz' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Link Quiz</button>
                    <button type="button" onClick={() => setAttachType('link')} className={`px-3 py-1 text-xs rounded-full font-bold transition ${attachType === 'link' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Link Khác</button>
                </div>

                {/* Input Area */}
                <div className="flex gap-2 items-center mb-3">
                    {attachType === 'file' ? (
                        <div className="flex-1">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        </div>
                    ) : (
                        <div className="flex-1 flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 px-3 py-2 border rounded text-sm" 
                                placeholder={attachType === 'pdf' ? "Link PDF..." : attachType === 'quiz' ? "Link Google Form/Quizizz..." : "https://..."}
                                value={attachInput}
                                onChange={e => setAttachInput(e.target.value)}
                            />
                            <input 
                                type="text" 
                                className="w-1/3 px-3 py-2 border rounded text-sm" 
                                placeholder="Tên hiển thị (Tùy chọn)"
                                value={attachName}
                                onChange={e => setAttachName(e.target.value)}
                            />
                            <button type="button" onClick={handleAddAttachment} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">
                                <Icon name="plus" size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* List of Attachments */}
                <div className="space-y-2">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-sm">
                            <div className="flex items-center overflow-hidden">
                                <div className={`p-1.5 rounded mr-2 ${att.type === 'pdf' ? 'bg-red-100 text-red-600' : att.type === 'quiz' ? 'bg-purple-100 text-purple-600' : att.type === 'file' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                    <Icon name={att.type === 'pdf' ? 'file' : att.type === 'quiz' ? 'form' : att.type === 'file' ? 'download' : 'link'} size={14} />
                                </div>
                                <span className="truncate max-w-[200px]" title={att.name}>{att.name}</span>
                                <span className="ml-2 text-xs text-gray-400 uppercase border border-gray-100 px-1 rounded">{att.type}</span>
                            </div>
                            <button type="button" onClick={() => handleRemoveAttachment(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                <Icon name="trash" size={14} />
                            </button>
                        </div>
                    ))}
                    {attachments.length === 0 && <p className="text-xs text-gray-400 italic text-center">Chưa có nội dung đính kèm.</p>}
                </div>
            </div>
            
            <div className="flex items-center mt-4">
                <input 
                    type="checkbox"
                    id="reqReply"
                    checked={editingTask.requireReply}
                    onChange={e => setEditingTask({...editingTask, requireReply: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="reqReply" className="ml-2 text-sm text-gray-700">Yêu cầu nộp bài / phản hồi</label>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    value={editingTask.description}
                    onChange={e => setEditingTask({...editingTask, description: e.target.value})}
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

      {/* Reply Monitor Modal */}
      <Modal
         isOpen={isReplyModalOpen}
         onClose={() => setIsReplyModalOpen(false)}
         title={`Theo dõi nộp bài: ${viewingTask?.title}`}
      >
          <div className="max-h-[60vh] overflow-y-auto">
              <div className="mb-4 text-sm text-gray-500">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <span>Tổng số học sinh: <strong>{classStudents.length}</strong></span>
                    <span>Đã nộp: <strong className="text-green-600">{taskReplies.length}</strong></span>
                    <span>Chưa nộp: <strong className="text-red-600">{classStudents.length - taskReplies.length}</strong></span>
                  </div>
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                      <tr>
                          <th className="px-3 py-2">Học sinh</th>
                          <th className="px-3 py-2">Trạng thái</th>
                          <th className="px-3 py-2">Nội dung</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {classStudents.map(s => {
                          const reply = taskReplies.find(r => r.studentId === s.id);
                          return (
                              <tr key={s.id}>
                                  <td className="px-3 py-3 font-medium">{s.fullName}</td>
                                  <td className="px-3 py-3">
                                      {reply ? (
                                          <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">Đã nộp</span>
                                      ) : (
                                          <span className="text-red-600 text-xs bg-red-50 px-2 py-1 rounded">Chưa nộp</span>
                                      )}
                                  </td>
                                  <td className="px-3 py-3 max-w-[200px]">
                                      {reply ? (
                                          <div>
                                              <p className="text-gray-800 break-words">{reply.replyText}</p>
                                              <div className="text-xs text-gray-400 mt-1">{new Date(reply.submittedAt).toLocaleDateString()}</div>
                                          </div>
                                      ) : <span className="text-gray-400">-</span>}
                                  </td>
                              </tr>
                          )
                      })}
                  </tbody>
              </table>
          </div>
      </Modal>
    </div>
  );
};