import React, { useEffect, useState, useRef } from 'react';
import { provider } from '../core/provider';
import { Question, QuestionType } from '../types';
import { Icon } from '../components/Icons';
import { Modal } from '../components/Modal';
import * as XLSX from 'xlsx';

export const QuestionBankManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<Partial<Question>>({});
  
  // Dynamic Form State
  const [mcOptions, setMcOptions] = useState<string[]>(['', '', '', '']);
  const [orderingOptions, setOrderingOptions] = useState<string[]>(['']);
  const [pairs, setPairs] = useState<{left: string, right: string}[]>([{left: '', right: ''}]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await provider.questions.list();
    setQuestions(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      
      let finalOptions = '[]';
      let finalAnswer = editingQ.correctAnswer || '';

      if (editingQ.type === 'multiple-choice') {
          finalOptions = JSON.stringify(mcOptions);
          // Correct answer is selected via radio
      } else if (editingQ.type === 'ordering') {
          // The correct answer is the string joined, options are the parts
          finalOptions = JSON.stringify(orderingOptions);
          finalAnswer = orderingOptions.join(' '); 
      } else if (editingQ.type === 'drag-drop') {
          finalOptions = JSON.stringify(pairs);
          finalAnswer = ''; // Logic handled by matching pairs
      }

      const payload = {
          ...editingQ,
          level: editingQ.level || 'General', // Default if empty
          optionsJson: finalOptions,
          correctAnswer: finalAnswer,
          points: Number(editingQ.points)
      };

      if (editingQ.id) {
          await provider.questions.update(editingQ.id, payload);
      } else {
          await provider.questions.add(payload as Omit<Question, 'id'>);
      }
      setIsModalOpen(false);
      loadData();
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Xóa câu hỏi này?')) {
          await provider.questions.remove(id);
          loadData();
      }
  };

  const openModal = (q?: Question) => {
      if (q) {
          setEditingQ(q);
          if (q.type === 'multiple-choice' || q.type === 'ordering') {
              const opts = JSON.parse(q.optionsJson);
              if (q.type === 'multiple-choice') setMcOptions(opts);
              if (q.type === 'ordering') setOrderingOptions(opts);
          } else if (q.type === 'drag-drop') {
              setPairs(JSON.parse(q.optionsJson));
          }
      } else {
          setEditingQ({
              type: 'multiple-choice',
              level: '',
              content: '',
              points: 10,
              correctAnswer: ''
          });
          setMcOptions(['', '', '', '']);
          setOrderingOptions(['']);
          setPairs([{left: '', right: ''}]);
      }
      setIsModalOpen(true);
  };

  const uniqueLevels = Array.from(new Set(questions.map(q => q.level))).sort();
  const filteredQuestions = questions.filter(q => filterLevel === 'all' || q.level === filterLevel);

  // Helper Inputs
  const handleMcOptionChange = (idx: number, val: string) => {
      const newOpts = [...mcOptions];
      newOpts[idx] = val;
      setMcOptions(newOpts);
  };

  const handleOrderingChange = (idx: number, val: string) => {
      const newOpts = [...orderingOptions];
      newOpts[idx] = val;
      setOrderingOptions(newOpts);
  };

  const addOrderingItem = () => setOrderingOptions([...orderingOptions, '']);
  const removeOrderingItem = (idx: number) => setOrderingOptions(orderingOptions.filter((_, i) => i !== idx));

  const handlePairChange = (idx: number, field: 'left' | 'right', val: string) => {
      const newPairs = [...pairs];
      newPairs[idx][field] = val;
      setPairs(newPairs);
  };
  const addPair = () => setPairs([...pairs, {left: '', right: ''}]);
  const removePair = (idx: number) => setPairs(pairs.filter((_, i) => i !== idx));

  // --- Excel Import Logic ---

  const handleDownloadTemplate = () => {
      const headers = ['Nội dung câu hỏi', 'Loại câu hỏi (Code)', 'Cấp độ', 'Điểm', 'Đáp án đúng', 'Cấu hình (Phân cách bởi | )'];
      const sampleData = [
          ['Màu nào là màu vàng?', 'multiple-choice', 'Lớp 1 - Unit 1', 10, 'Yellow', 'Red | Blue | Green | Yellow'],
          ['Dịch sang tiếng Anh: "Quả táo"', 'short-answer', 'Lớp 1 - Unit 2', 15, 'Apple', ''],
          ['Dịch sang tiếng Anh: "Con mèo"', 'short-answer', 'Lớp 2 - Unit 1', 15, 'Cat', ''],
          ['Sắp xếp câu: I like apples', 'ordering', 'Lớp 3 - Unit 1', 20, 'I like apples', 'I | like | apples'],
          ['Nối con vật', 'drag-drop', 'Lớp 4 - Unit 5', 20, '', 'Dog:Con chó | Cat:Con mèo | Bird:Con chim'],
          ['Choose correct word: She ___ to school.', 'multiple-choice', 'Lớp 5 - Unit 20', 10, 'goes', 'go | goes | went | gone']
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      const wscols = [{ wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 40 }];
      ws['!cols'] = wscols;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mau_Cau_Hoi");
      XLSX.writeFile(wb, "Mau_Game_Cau_Hoi.xlsx");
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
                  const type = (row['Loại câu hỏi (Code)'] || 'multiple-choice').trim() as QuestionType;
                  const rawConfig = String(row['Cấu hình (Phân cách bởi | )'] || '');
                  
                  let optionsJson = '[]';
                  let correctAnswer = row['Đáp án đúng'] || '';

                  if (type === 'multiple-choice') {
                      const opts = rawConfig.split('|').map((s: string) => s.trim());
                      optionsJson = JSON.stringify(opts);
                  } else if (type === 'ordering') {
                      const opts = rawConfig.split('|').map((s: string) => s.trim());
                      optionsJson = JSON.stringify(opts);
                      if (!correctAnswer) correctAnswer = opts.join(' ');
                  } else if (type === 'drag-drop') {
                      const pairsArr = rawConfig.split('|').map((s: string) => {
                          const parts = s.split(':');
                          return { left: parts[0]?.trim() || '', right: parts[1]?.trim() || '' };
                      });
                      optionsJson = JSON.stringify(pairsArr);
                  }

                  await provider.questions.add({
                      content: row['Nội dung câu hỏi'] || 'Question',
                      type: type,
                      level: row['Cấp độ'] || 'General',
                      points: Number(row['Điểm']) || 10,
                      correctAnswer: String(correctAnswer),
                      optionsJson: optionsJson
                  });
                  successCount++;
              } catch (err) {
                  console.error('Error importing row', row, err);
              }
          }

          alert(`Đã thêm thành công ${successCount} câu hỏi.`);
          loadData();
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Game</h2>
        <div className="flex space-x-2">
            <select 
                className="px-3 py-2 border rounded-lg text-sm max-w-[150px]"
                value={filterLevel}
                onChange={e => setFilterLevel(e.target.value)}
            >
                <option value="all">Tất cả cấp độ</option>
                {uniqueLevels.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                ))}
            </select>
            
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
                     <th className="px-6 py-4">Nội dung câu hỏi</th>
                     <th className="px-6 py-4">Loại</th>
                     <th className="px-6 py-4">Cấp độ / Bộ đề</th>
                     <th className="px-6 py-4 text-center">Điểm</th>
                     <th className="px-6 py-4 text-right">Thao tác</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                 {filteredQuestions.map(q => (
                     <tr key={q.id} className="hover:bg-gray-50">
                         <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">{q.content}</td>
                         <td className="px-6 py-4 text-sm text-gray-600 capitalize">{q.type.replace('-', ' ')}</td>
                         <td className="px-6 py-4">
                             <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{q.level}</span>
                         </td>
                         <td className="px-6 py-4 text-center font-bold text-emerald-600">{q.points}</td>
                         <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => openModal(q)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Sửa</button>
                            <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                         </td>
                     </tr>
                 ))}
                 {filteredQuestions.length === 0 && (
                     <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chưa có câu hỏi nào.</td></tr>
                 )}
             </tbody>
         </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQ.id ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}
      >
          <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loại câu hỏi</label>
                      <select
                          className="w-full px-3 py-2 border rounded-lg"
                          value={editingQ.type}
                          onChange={e => setEditingQ({...editingQ, type: e.target.value as QuestionType})}
                          disabled={!!editingQ.id}
                      >
                          <option value="multiple-choice">Trắc nghiệm (4 chọn 1)</option>
                          <option value="short-answer">Trả lời ngắn</option>
                          <option value="ordering">Sắp xếp câu</option>
                          <option value="drag-drop">Nối từ (Kéo thả)</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ / Tên bộ đề</label>
                      <input
                          type="text"
                          list="level-suggestions"
                          className="w-full px-3 py-2 border rounded-lg"
                          value={editingQ.level}
                          onChange={e => setEditingQ({...editingQ, level: e.target.value})}
                          placeholder="VD: Unit 1, Bài 5, ..."
                      />
                      <datalist id="level-suggestions">
                          {uniqueLevels.map(lvl => <option key={lvl} value={lvl} />)}
                      </datalist>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung câu hỏi</label>
                  <textarea
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                      value={editingQ.content}
                      onChange={e => setEditingQ({...editingQ, content: e.target.value})}
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điểm số</label>
                  <input
                      type="number"
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                      value={editingQ.points}
                      onChange={e => setEditingQ({...editingQ, points: Number(e.target.value)})}
                  />
              </div>

              {/* Dynamic Fields based on Type */}
              <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-800 mb-3">Đáp án & Cấu hình</h4>
                  
                  {editingQ.type === 'multiple-choice' && (
                      <div className="space-y-2">
                          {mcOptions.map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    name="correctAnswer"
                                    checked={editingQ.correctAnswer === opt && opt !== ''}
                                    onChange={() => setEditingQ({...editingQ, correctAnswer: opt})}
                                    className="h-4 w-4 text-emerald-600"
                                  />
                                  <input
                                      type="text"
                                      placeholder={`Lựa chọn ${idx + 1}`}
                                      className="flex-1 px-3 py-2 border rounded-lg"
                                      value={opt}
                                      onChange={e => handleMcOptionChange(idx, e.target.value)}
                                      required
                                  />
                              </div>
                          ))}
                          <p className="text-xs text-gray-500 mt-1">Chọn radio bên cạnh đáp án đúng.</p>
                      </div>
                  )}

                  {editingQ.type === 'short-answer' && (
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Đáp án đúng (Chính xác)</label>
                          <input
                              type="text"
                              required
                              className="w-full px-3 py-2 border rounded-lg"
                              value={editingQ.correctAnswer}
                              onChange={e => setEditingQ({...editingQ, correctAnswer: e.target.value})}
                          />
                      </div>
                  )}

                  {editingQ.type === 'ordering' && (
                      <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Các thành phần (Theo đúng thứ tự)</label>
                          {orderingOptions.map((item, idx) => (
                              <div key={idx} className="flex gap-2">
                                  <span className="py-2 text-gray-400 font-mono">{idx + 1}.</span>
                                  <input
                                      type="text"
                                      className="flex-1 px-3 py-2 border rounded-lg"
                                      value={item}
                                      onChange={e => handleOrderingChange(idx, e.target.value)}
                                      required
                                  />
                                  <button type="button" onClick={() => removeOrderingItem(idx)} className="text-red-500">&times;</button>
                              </div>
                          ))}
                          <button type="button" onClick={addOrderingItem} className="text-sm text-blue-600 hover:underline">+ Thêm thành phần</button>
                      </div>
                  )}

                  {editingQ.type === 'drag-drop' && (
                      <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Cặp từ nối (Trái - Phải)</label>
                          {pairs.map((p, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                  <input
                                      type="text"
                                      placeholder="Vế trái (Ví dụ: Dog)"
                                      className="flex-1 px-3 py-2 border rounded-lg"
                                      value={p.left}
                                      onChange={e => handlePairChange(idx, 'left', e.target.value)}
                                      required
                                  />
                                  <Icon name="link" size={16} className="text-gray-400" />
                                  <input
                                      type="text"
                                      placeholder="Vế phải (Ví dụ: Con chó)"
                                      className="flex-1 px-3 py-2 border rounded-lg"
                                      value={p.right}
                                      onChange={e => handlePairChange(idx, 'right', e.target.value)}
                                      required
                                  />
                                  <button type="button" onClick={() => removePair(idx)} className="text-red-500">&times;</button>
                              </div>
                          ))}
                          <button type="button" onClick={addPair} className="text-sm text-blue-600 hover:underline">+ Thêm cặp</button>
                      </div>
                  )}
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