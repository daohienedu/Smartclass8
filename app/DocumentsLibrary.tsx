import React, { useEffect, useState } from 'react';
import { provider } from '../core/provider';
import { Document, Student, User, DocumentProgress } from '../types';
import { Icon } from '../components/Icons';

export const DocumentsLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [progress, setProgress] = useState<DocumentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string>('');
  
  // Navigation State
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  
  useEffect(() => {
    const load = async () => {
      const userJson = localStorage.getItem('mrs_hien_user');
      let classId = 'all';
      let sId = '';

      if (userJson) {
          const user = JSON.parse(userJson) as User;
          let currentStudent: Student | null = null;
          
          if (user.role === 'student' && user.relatedId) {
             try {
                currentStudent = await provider.students.get(user.relatedId);
             } catch(e) {}
          }
          if (!currentStudent) {
             const all = await provider.students.list();
             currentStudent = all.find(s => s.fullName === user.fullName) || null;
          }

          if (currentStudent) {
              classId = currentStudent.classId;
              sId = currentStudent.id;
              setStudentId(sId);
          }
      }

      const [docs, progs] = await Promise.all([
          provider.documents.list(classId),
          sId ? provider.documents.getProgress(sId) : Promise.resolve([])
      ]);
      
      setDocuments(docs);
      setProgress(progs);
      setLoading(false);
    };
    load();
  }, []);

  const handleDocumentClick = (doc: Document) => {
      const videoId = getYoutubeId(doc.url);
      const isPdf = doc.url.toLowerCase().endsWith('.pdf');
      
      let effectiveType = doc.type;
      
      if (!effectiveType || effectiveType === 'link') {
          if (videoId || doc.url.includes('/embed/')) effectiveType = 'video';
          else if (isPdf) effectiveType = 'pdf';
          else effectiveType = 'link';
      }

      if (effectiveType === 'link') {
          window.open(doc.url, '_blank');
          updateProgress(doc.id, true, 0);
      } else {
          setActiveDoc({ ...doc, type: effectiveType as any });
          setViewerOpen(true);
      }
  };

  const updateProgress = async (docId: string, completed: boolean, timeSpent: number) => {
      if (!studentId) return;
      const newEntry: DocumentProgress = {
          studentId,
          documentId: docId,
          completed,
          timeSpent,
          lastViewedAt: new Date().toISOString()
      };
      
      const idx = progress.findIndex(p => p.documentId === docId);
      if (idx > -1) {
          const newProg = [...progress];
          newProg[idx] = newEntry;
          setProgress(newProg);
      } else {
          setProgress([...progress, newEntry]);
      }
      await provider.documents.saveProgress(newEntry);
  };

  const getUnits = (grade: string) => {
      const maxUnits = (grade === '1' || grade === '2') ? 16 : 20;
      return Array.from({ length: maxUnits }, (_, i) => `Unit ${i + 1}`);
  };

  const isCompleted = (docId: string) => {
      return progress.some(p => p.documentId === docId && p.completed);
  };

  const filteredDocs = documents.filter(d => {
      if (!selectedGrade) return false;
      const gradeMatch = String(d.grade || '').trim() === String(selectedGrade).trim();
      if (!gradeMatch) return false;
      if (selectedUnit) {
          const unitMatch = (d.unit || '').trim() === selectedUnit.trim();
          if (!unitMatch) return false;
      }
      return true;
  });
  
  const rootDocs = [...documents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

  const renderBreadcrumb = () => (
      <div className="flex items-center text-sm text-gray-500 mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <button 
            onClick={() => { setSelectedGrade(null); setSelectedUnit(null); }}
            className={`hover:text-emerald-600 ${!selectedGrade ? 'font-bold text-emerald-700' : ''}`}
          >
              <Icon name="home" size={16} className="inline mr-1" /> Thư viện
          </button>
          
          {selectedGrade && (
              <>
                <Icon name="chevronRight" size={14} className="mx-2" />
                <button 
                    onClick={() => setSelectedUnit(null)}
                    className={`hover:text-emerald-600 ${!selectedUnit ? 'font-bold text-emerald-700' : ''}`}
                >
                    Khối {selectedGrade}
                </button>
              </>
          )}

          {selectedUnit && (
               <>
                <Icon name="chevronRight" size={14} className="mx-2" />
                <span className="font-bold text-emerald-700">{selectedUnit}</span>
               </>
          )}
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Tài liệu học tập</h2>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải...</div>
      ) : (
        <>
            {renderBreadcrumb()}
            {!selectedGrade && (
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Chọn Khối Lớp</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setSelectedGrade(String(g))}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition flex flex-col items-center justify-center group"
                                >
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-3 group-hover:bg-blue-100 group-hover:scale-110 transition">
                                        <Icon name="folder" size={32} />
                                    </div>
                                    <span className="font-bold text-gray-800">Khối {g}</span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        {documents.filter(d => String(d.grade || '') === String(g)).length} tài liệu
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {rootDocs.length > 0 && (
                        <div>
                             <h3 className="text-lg font-bold text-gray-700 mb-4">Tài liệu chung & Mới nhất</h3>
                             <div className="grid md:grid-cols-2 gap-4">
                                {rootDocs.map(doc => (
                                    <DocItem 
                                        key={doc.id} 
                                        doc={doc} 
                                        completed={isCompleted(doc.id)} 
                                        onClick={() => handleDocumentClick(doc)}
                                    />
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            )}

            {selectedGrade && !selectedUnit && (
                <div>
                     <h3 className="text-lg font-bold text-gray-700 mb-4">Danh sách Bài học - Khối {selectedGrade}</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {getUnits(selectedGrade).map(unit => {
                             const count = documents.filter(d => 
                                String(d.grade || '') === String(selectedGrade) && 
                                (d.unit || '').trim() === unit
                             ).length;
                             
                             return (
                                <button
                                    key={unit}
                                    onClick={() => setSelectedUnit(unit)}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition text-left group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Icon name="folder" className="text-yellow-500 group-hover:scale-110 transition" size={24} />
                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{count}</span>
                                    </div>
                                    <div className="font-medium text-gray-800">{unit}</div>
                                </button>
                             );
                        })}
                     </div>
                </div>
            )}

            {selectedGrade && selectedUnit && (
                <div>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-700">Tài liệu: {selectedUnit} (Khối {selectedGrade})</h3>
                     </div>
                     
                     {filteredDocs.length === 0 ? (
                         <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                             <Icon name="folder" size={48} className="mx-auto text-gray-200 mb-2" />
                             <p className="text-gray-400">Chưa có tài liệu nào trong thư mục này.</p>
                         </div>
                     ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {filteredDocs.map(doc => (
                                <DocItem 
                                    key={doc.id} 
                                    doc={doc} 
                                    completed={isCompleted(doc.id)}
                                    onClick={() => handleDocumentClick(doc)}
                                />
                            ))}
                        </div>
                     )}
                </div>
            )}
        </>
      )}

      {viewerOpen && activeDoc && (
          <DocumentViewer 
             doc={activeDoc} 
             onClose={() => setViewerOpen(false)} 
             onComplete={(time) => updateProgress(activeDoc.id, true, time)}
             initialCompleted={isCompleted(activeDoc.id)}
          />
      )}
    </div>
  );
};

const DocItem: React.FC<{ doc: Document; completed: boolean; onClick: () => void }> = ({ doc, completed, onClick }) => {
    const videoId = getYoutubeId(doc.url);
    const isPdf = doc.url.toLowerCase().endsWith('.pdf');
    let effectiveType = doc.type;
    
    if (!effectiveType || effectiveType === 'link') {
        if (videoId || doc.url.includes('/embed/')) effectiveType = 'video';
        else if (isPdf) effectiveType = 'pdf';
        else effectiveType = 'link';
    }

    return (
        <div 
            onClick={onClick}
            className={`bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition flex items-start cursor-pointer relative ${completed ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}
        >
            <div className={`p-3 rounded-lg mr-4 ${completed ? 'bg-green-100 text-green-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <Icon name={effectiveType === 'video' ? 'camera' : effectiveType === 'pdf' ? 'file' : 'link'} size={24} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded mb-1 inline-block">
                        {doc.category}
                    </span>
                    {completed && <Icon name="check" size={16} className="text-green-500" />}
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{doc.title}</h3>
                <div className="text-xs text-gray-500 mb-2">
                    {effectiveType === 'video' ? 'Video Bài giảng' : effectiveType === 'pdf' ? 'Tài liệu PDF' : 'Liên kết ngoài'}
                    {doc.minDuration ? ` • Yêu cầu: ${doc.minDuration}s` : ''}
                </div>
            </div>
        </div>
    );
};

const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const getEmbedUrl = (docUrl: string) => {
    try {
        const origin = window.location.origin;
        if (docUrl.includes('/embed/')) {
            const url = new URL(docUrl);
            url.searchParams.set('autoplay', '1');
            url.searchParams.set('origin', origin);
            // Use nocookie domain to avoid 153 error/privacy blocks
            return url.toString().replace('youtube.com', 'youtube-nocookie.com');
        }
        
        const videoId = getYoutubeId(docUrl);
        if (videoId) {
            return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&origin=${origin}&rel=0&modestbranding=1`;
        }
    } catch (e) {
        console.warn("Invalid video URL", e);
    }
    return null;
};

const DocumentViewer: React.FC<{ 
    doc: Document; 
    onClose: () => void; 
    onComplete: (time: number) => void;
    initialCompleted: boolean;
}> = ({ doc, onClose, onComplete, initialCompleted }) => {
    const [timer, setTimer] = useState(0);
    const [isComplete, setIsComplete] = useState(initialCompleted);
    const minTime = doc.minDuration || 0;
    
    const embedUrl = doc.type === 'video' ? getEmbedUrl(doc.url) : null;

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleFinish = () => {
        setIsComplete(true);
        onComplete(timer);
        onClose();
    };

    const canFinish = timer >= minTime;
    const progressPercent = Math.min((timer / (minTime || 1)) * 100, 100);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
             <div className="w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg flex flex-col overflow-hidden relative">
                 <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                     <div>
                         <h3 className="font-bold text-gray-800 text-lg">{doc.title}</h3>
                         <div className="text-xs text-gray-500 flex items-center mt-1">
                             <Icon name="clock" size={12} className="mr-1" />
                             Đã xem: {timer}s 
                             {minTime > 0 && <span className="ml-1">/ Yêu cầu: {minTime}s</span>}
                         </div>
                     </div>
                     <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">✕</button>
                 </div>
                 
                 {minTime > 0 && !isComplete && (
                     <div className="h-1 bg-gray-200 w-full">
                         <div 
                            className="h-full bg-green-500 transition-all duration-1000 ease-linear" 
                            style={{ width: `${progressPercent}%` }}
                         />
                     </div>
                 )}

                 <div className="flex-1 bg-black flex items-center justify-center relative flex-col">
                     {doc.type === 'video' ? (
                         embedUrl ? (
                             <>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={embedUrl}
                                    title={doc.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                    className="z-10"
                                />
                                <div className="absolute bottom-8 left-0 w-full flex justify-center pointer-events-none z-20">
                                    <a 
                                        href={doc.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="pointer-events-auto flex items-center bg-gray-900/80 text-white px-5 py-2 rounded-full text-xs hover:bg-gray-800 transition border border-gray-600 shadow-xl backdrop-blur-sm"
                                    >
                                        <Icon name="link" size={14} className="mr-2" />
                                        Nếu lỗi (Error 153), bấm vào đây để mở tab mới
                                    </a>
                                </div>
                             </>
                         ) : (
                             <div className="text-white text-center">
                                 <p className="mb-2">Lỗi: Đường dẫn video không hợp lệ.</p> 
                                 <a href={doc.url} target="_blank" className="underline text-blue-400 bg-white/10 px-3 py-1 rounded">Mở link gốc</a>
                             </div>
                         )
                     ) : doc.type === 'pdf' ? (
                         <iframe
                             src={doc.url}
                             width="100%"
                             height="100%"
                             className="bg-white"
                             title="PDF Viewer"
                         />
                     ) : (
                         <div className="text-white text-center">
                             <p>Loại tài liệu này không hỗ trợ xem trực tiếp.</p>
                             <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-400 underline mt-2 block">Mở trong tab mới</a>
                         </div>
                     )}
                 </div>

                 <div className="p-4 border-t bg-white flex justify-end items-center gap-4">
                     {isComplete ? (
                         <span className="text-green-600 font-bold flex items-center">
                             <Icon name="check" className="mr-2" /> Đã hoàn thành
                         </span>
                     ) : (
                         <div className="text-sm text-gray-500 italic mr-2">
                             {canFinish ? 'Bạn đã xem đủ thời gian yêu cầu.' : `Vui lòng xem thêm ${minTime - timer} giây để hoàn thành.`}
                         </div>
                     )}
                     
                     <button
                        onClick={handleFinish}
                        disabled={!canFinish && !isComplete}
                        className={`px-6 py-2 rounded-lg font-bold transition flex items-center ${
                            canFinish || isComplete
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                     >
                         {isComplete ? 'Đóng' : 'Đánh dấu hoàn thành'}
                     </button>
                 </div>
             </div>
        </div>
    );
};