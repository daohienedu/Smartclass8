import React, { useEffect, useState, useMemo } from 'react';
import { provider } from '../core/provider';
import { Question } from '../types';
import { Icon } from '../components/Icons';

export const LevelGame: React.FC = () => {
  const [level, setLevel] = useState<string | null>(null);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Input States
  const [userAnswer, setUserAnswer] = useState(''); // For MC, Short Answer
  const [orderedItems, setOrderedItems] = useState<string[]>([]); // For Ordering
  const [matches, setMatches] = useState<{left: string, right: string}[]>([]); // For DragDrop
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null); // For DragDrop logic

  useEffect(() => {
    // Load available levels on mount
    const loadLevels = async () => {
        const allQuestions = await provider.questions.list();
        const levels = Array.from(new Set(allQuestions.map(q => q.level))).filter(Boolean);
        
        // General Sort: Group first, then numeric suffix, fallback to string compare
        levels.sort((a, b) => {
            const groupA = a.split(' - ')[0] || a;
            const groupB = b.split(' - ')[0] || b;

            if (groupA !== groupB) {
                // Try to sort by "Lớp X" number if possible
                const getGradeNum = (s: string) => {
                     const m = s.match(/Lớp (\d+)/);
                     return m ? parseInt(m[1]) : 999;
                };
                const numA = getGradeNum(groupA);
                const numB = getGradeNum(groupB);
                
                if (numA !== numB) return numA - numB;
                return groupA.localeCompare(groupB);
            }

            // Same group, sort by numeric suffix (Unit X, Đề X)
            const getSubNum = (s: string) => {
                const m = s.match(/(\d+)$/);
                return m ? parseInt(m[1]) : -1;
            };
            const nA = getSubNum(a);
            const nB = getSubNum(b);

            // If both have numbers, sort numerically
            if (nA !== -1 && nB !== -1) return nA - nB;
            
            // Otherwise sort alphabetically (handles "Kinh tế", "Lịch sử" etc)
            return a.localeCompare(b);
        });

        setAvailableLevels(levels);
    };
    loadLevels();
  }, []);

  const groupedLevels = useMemo(() => {
      const groups: Record<string, string[]> = {};
      availableLevels.forEach(lvl => {
          // Extract Group Name by taking everything before the first " - "
          // E.g., "Lớp 1 - Unit 1" -> "Lớp 1", "Bắc Ninh - Đề 1" -> "Bắc Ninh"
          const parts = lvl.split(' - ');
          const groupName = parts.length > 1 ? parts[0] : 'Khác';
          
          if (!groups[groupName]) groups[groupName] = [];
          groups[groupName].push(lvl);
      });
      return groups;
  }, [availableLevels]);

  const startGame = async (selectedLevel: string) => {
    setLevel(selectedLevel);
    const data = await provider.questions.list(selectedLevel);
    // Shuffle questions logic could go here
    setQuestions(data);
    setScore(0);
    setCurrentIndex(0);
    setGameState('playing');
    setFeedback(null);
    resetInputs();
  };

  const currentQ = questions[currentIndex];

  const mcOptions = useMemo<string[]>(() => {
    if (currentQ?.type === 'multiple-choice') {
        try {
            return JSON.parse(currentQ.optionsJson) as string[];
        } catch {
            return [];
        }
    }
    return [];
  }, [currentQ]);

  const resetInputs = () => {
      setUserAnswer('');
      setOrderedItems([]);
      setMatches([]);
      setSelectedLeft(null);
  };

  const handleNext = () => {
      if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setFeedback(null);
          resetInputs();
      } else {
          setGameState('result');
      }
  };

  const checkAnswer = () => {
      if (!currentQ) return;
      let isCorrect = false;

      if (currentQ.type === 'multiple-choice') {
          isCorrect = userAnswer === currentQ.correctAnswer;
      } else if (currentQ.type === 'short-answer') {
          isCorrect = userAnswer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim();
      } else if (currentQ.type === 'ordering') {
          const correctOrder = JSON.parse(currentQ.optionsJson) as string[];
          isCorrect = JSON.stringify(orderedItems) === JSON.stringify(correctOrder);
      } else if (currentQ.type === 'drag-drop') {
          const correctPairs = JSON.parse(currentQ.optionsJson) as {left: string, right: string}[];
          // Check if all matches are correct
          if (matches.length !== correctPairs.length) isCorrect = false;
          else {
              isCorrect = matches.every(m => {
                  const target = correctPairs.find(cp => cp.left === m.left);
                  return target && target.right === m.right;
              });
          }
      }

      if (isCorrect) {
          setScore(score + currentQ.points);
          setFeedback('correct');
      } else {
          setFeedback('wrong');
      }
  };

  // --- Render Components ---

  const renderOrdering = () => {
      if (!currentQ) return null;
      let parts: string[] = [];
      try {
        const parsed = JSON.parse(currentQ.optionsJson);
        if (Array.isArray(parsed)) {
            parts = parsed as string[];
        }
      } catch (e) {
        console.error("JSON parse error", e);
      }

      // We need a shuffled pool. In a real app, shuffle once on load. Here we just filter out used ones.
      const available = parts.filter(p => !orderedItems.includes(p)); 

      return (
          <div className="space-y-6">
              <div className="min-h-[60px] p-4 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex flex-wrap gap-2">
                  {orderedItems.map((item, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setOrderedItems(orderedItems.filter((_, i) => i !== idx))}
                        className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg font-medium hover:bg-red-50"
                      >
                          {item}
                      </button>
                  ))}
                  {orderedItems.length === 0 && <span className="text-gray-400 italic">Chọn từ bên dưới để sắp xếp...</span>}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                  {[...available].sort().map((item, idx) => ( // Simple sort to randomize slightly if they weren't already
                       <button 
                       key={idx} 
                       onClick={() => setOrderedItems([...orderedItems, item])}
                       className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-medium hover:bg-blue-100"
                     >
                         {item}
                     </button>
                  ))}
              </div>
          </div>
      );
  };

  const renderDragDrop = () => {
      if (!currentQ) return null;
      let pairsData: {left: string, right: string}[] = [];
      try {
        const parsed = JSON.parse(currentQ.optionsJson);
        if (Array.isArray(parsed)) {
            pairsData = parsed as {left: string, right: string}[];
        }
      } catch (e) {
        console.error("JSON parse error", e);
      }
      
      const lefts = pairsData.map((p: {left: string, right: string}) => p.left);
      const rights = pairsData.map((p: {left: string, right: string}) => p.right); 

      const isMatchedLeft = (val: string) => matches.some(m => m.left === val);
      const isMatchedRight = (val: string) => matches.some(m => m.right === val);

      const handleLeftClick = (val: string) => {
          if (!isMatchedLeft(val)) setSelectedLeft(val);
      };

      const handleRightClick = (val: string) => {
          if (selectedLeft && !isMatchedRight(val)) {
              setMatches([...matches, {left: selectedLeft, right: val}]);
              setSelectedLeft(null);
          }
      };

      return (
          <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                  {lefts.map((l, idx) => (
                      <button
                        key={idx}
                        disabled={isMatchedLeft(l)}
                        onClick={() => handleLeftClick(l)}
                        className={`w-full p-3 rounded-lg border text-left font-medium transition ${
                            isMatchedLeft(l) ? 'bg-gray-100 text-gray-400 border-gray-200' :
                            selectedLeft === l ? 'bg-blue-100 border-blue-500 text-blue-800 ring-2 ring-blue-200' :
                            'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                          {l}
                      </button>
                  ))}
              </div>
              <div className="space-y-3">
                   {rights.map((r, idx) => (
                      <button
                        key={idx}
                        disabled={isMatchedRight(r)}
                        onClick={() => handleRightClick(r)}
                        className={`w-full p-3 rounded-lg border text-right font-medium transition ${
                            isMatchedRight(r) ? 'bg-gray-100 text-gray-400 border-gray-200' :
                            'bg-white border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                          {r}
                      </button>
                  ))}
              </div>
              <div className="col-span-2 mt-4">
                  <div className="text-sm font-bold text-gray-600 mb-2">Đã ghép:</div>
                  <div className="flex flex-wrap gap-2">
                      {matches.map((m, idx) => (
                          <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm border border-emerald-200">
                              {m.left} ↔ {m.right}
                              <button onClick={() => setMatches(matches.filter((_, i) => i !== idx))} className="ml-2 font-bold hover:text-red-500">&times;</button>
                          </span>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  if (gameState === 'menu') {
      return (
        <div className="max-w-6xl mx-auto pt-6 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 min-h-[80vh]">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="gamepad" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Game Tiếng Anh</h1>
                    <p className="text-gray-500">Chọn một bộ đề bên dưới để bắt đầu thử thách!</p>
                </div>
                
                {availableLevels.length === 0 ? (
                    <div className="text-center text-gray-400 italic py-8 border-2 border-dashed border-gray-100 rounded-xl">
                        Hiện tại chưa có bộ câu hỏi nào.
                        <br />
                        Vui lòng quay lại sau!
                    </div>
                ) : (
                    <div className="space-y-10">
                        {Object.entries(groupedLevels).map(([group, levels]: [string, string[]]) => (
                            <div key={group} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                <h2 className="text-xl font-bold text-emerald-800 mb-4 border-b border-gray-200 pb-2 flex items-center">
                                    <Icon name="book" className="mr-2" size={20} />
                                    {group}
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {levels.map(lvl => (
                                        <button
                                            key={lvl}
                                            onClick={() => startGame(lvl)}
                                            className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-emerald-400 hover:text-emerald-700 transition text-sm font-medium text-gray-700 text-center"
                                        >
                                            {lvl.replace(`${group} - `, '')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      );
  }

  if (gameState === 'result') {
      return (
        <div className="max-w-md mx-auto text-center pt-10">
            <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoàn thành!</h2>
                <p className="text-gray-500">Bạn đã hoàn thành bộ đề <strong className="text-gray-800">{level}</strong>.</p>
                
                <div className="my-8 bg-emerald-50 p-6 rounded-xl">
                    <div className="text-sm uppercase text-emerald-600 font-bold tracking-wider">Tổng điểm</div>
                    <div className="text-5xl font-extrabold text-emerald-700 mt-2">{score}</div>
                </div>

                <button 
                    onClick={() => setGameState('menu')}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition"
                >
                    Chọn game khác
                </button>
            </div>
        </div>
      );
  }

  if (gameState === 'playing' && !currentQ) return <div className="p-8 text-center text-gray-500">Đang tải câu hỏi...</div>;

  return (
    <div className="max-w-3xl mx-auto">
        {/* Header Progress */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
                <button onClick={() => setGameState('menu')} className="text-gray-400 hover:text-gray-600 mr-4">
                    <Icon name="logOut" className="rotate-180" />
                </button>
                <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{level}</div>
            </div>
            <div className="text-gray-600 font-medium">Câu {currentIndex + 1} / {questions.length}</div>
            <div className="font-bold text-orange-500">{score} pts</div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Question Content */}
            <div className="p-8 border-b border-gray-100 text-center">
                <h3 className="text-xl font-bold text-gray-800 leading-relaxed">{currentQ.content}</h3>
            </div>

            {/* Answer Area */}
            <div className="p-8 bg-gray-50">
                {currentQ.type === 'multiple-choice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mcOptions.map((opt, idx) => (
                            <button
                                key={idx}
                                disabled={!!feedback}
                                onClick={() => setUserAnswer(opt)}
                                className={`p-4 rounded-xl border-2 text-left font-medium transition ${
                                    userAnswer === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-white bg-white hover:border-gray-300'
                                }`}
                            >
                                <span className="inline-block w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-center text-sm leading-6 mr-3">
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {currentQ.type === 'short-answer' && (
                    <div className="max-w-md mx-auto">
                        <input 
                            type="text"
                            disabled={!!feedback}
                            className="w-full p-4 text-center text-lg rounded-xl border-2 border-gray-200 focus:border-emerald-500 outline-none"
                            placeholder="Nhập câu trả lời của bạn..."
                            value={userAnswer}
                            onChange={e => setUserAnswer(e.target.value)}
                        />
                    </div>
                )}

                {currentQ.type === 'ordering' && renderOrdering()}
                {currentQ.type === 'drag-drop' && renderDragDrop()}
            </div>

            {/* Footer Action */}
            <div className="p-6 bg-white border-t border-gray-100 flex justify-center">
                {!feedback ? (
                    <button 
                        onClick={checkAnswer}
                        disabled={
                            (currentQ.type === 'multiple-choice' || currentQ.type === 'short-answer') && !userAnswer ||
                            (currentQ.type === 'ordering' && orderedItems.length === 0) ||
                            (currentQ.type === 'drag-drop' && matches.length === 0)
                        }
                        className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-200"
                    >
                        Kiểm tra
                    </button>
                ) : (
                    <div className="w-full">
                        <div className={`mb-4 p-4 rounded-xl flex items-center justify-center ${feedback === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <Icon name={feedback === 'correct' ? 'check' : 'alert'} size={24} className="mr-2" />
                            <span className="font-bold text-lg">{feedback === 'correct' ? 'Chính xác! + ' + currentQ.points + ' điểm' : 'Sai rồi! Đáp án đúng là: ' + currentQ.correctAnswer}</span>
                        </div>
                        <button 
                            onClick={handleNext}
                            className="w-full px-8 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition"
                        >
                            {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
