import React, { useState } from 'react';
import { Question } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, XCircle, CheckCircle2, Gift as GiftIcon } from 'lucide-react';

interface QuizGameProps {
  questions: Question[];
  onWin: () => void;
  onLog: (action: string, details: string) => void;
}

export const QuizGame: React.FC<QuizGameProps> = ({ questions, onWin, onLog }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  
  const currentQuestion = questions[currentIndex % questions.length];

  const handleOptionClick = (option: string) => {
    if (selectedOption || feedback) return; 
    setSelectedOption(option);

    const isCorrect = option === currentQuestion.correctAnswer;

    if (isCorrect) {
      setFeedback('CORRECT');
      
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50); 
      }

      onLog('ANSWER_CORRECT', `QID:${currentQuestion.id}`);
      setTimeout(() => {
        const newStreak = streak + 1;
        if (newStreak >= 5) {
          onWin();
        } else {
          setStreak(newStreak);
          setCurrentIndex((prev) => prev + 1);
          setFeedback(null);
          setSelectedOption(null);
        }
      }, 1200);
    } else {
      setFeedback('WRONG');
      
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200); 
      }

      onLog('ANSWER_WRONG', `QID:${currentQuestion.id} | Answered:${option} | Correct:${currentQuestion.correctAnswer}`);
    }
  };

  const handleRetry = () => {
    setStreak(0);
    setFeedback(null);
    setSelectedOption(null);
    setCurrentIndex((prev) => prev + Math.floor(Math.random() * 5) + 1); 
  };

  const remaining = 5 - streak;

  return (
    <div className="flex flex-col items-center justify-start min-h-[70vh] w-full max-w-md mx-auto p-6 relative">
      
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full mb-6 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between relative overflow-hidden"
      >
         <div 
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-fuchsia-500 transition-all duration-500 ease-out"
            style={{ width: `${(streak / 5) * 100}%` }}
         ></div>

         <div className="flex items-center gap-3 z-10">
            <div className={`p-2 rounded-xl transition-colors duration-300 ${streak >= 4 ? 'bg-yellow-500/20 ring-2 ring-yellow-500/50' : 'bg-white/10'}`}>
                <GiftIcon className={`w-6 h-6 transition-all duration-300 ${streak >= 4 ? 'text-yellow-400 animate-bounce' : 'text-blue-200'}`} />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">目標獎勵</span>
                <span className="text-sm font-bold text-white">神秘禮盒</span>
            </div>
         </div>

         <div className="flex flex-col items-end z-10">
             <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">距離解鎖</span>
             <span className="text-sm font-mono text-white">
                還差 <span className="text-yellow-400 font-bold text-lg">{remaining}</span> 題
             </span>
         </div>
      </motion.div>

      <div className="flex justify-center space-x-2 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{ 
              scale: i <= streak ? 1.2 : 1,
              color: i <= streak ? '#FACC15' : '#4B5563', 
              fill: i <= streak ? '#FACC15' : 'transparent' 
            }}
            className="text-gray-600 relative"
          >
            <Star 
              className={`w-8 h-8 ${i <= streak ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : ''}`} 
              fill={i <= streak ? "currentColor" : "none"}
              strokeWidth={i <= streak ? 0 : 2}
            />
          </motion.div>
        ))}
      </div>

      <div className="text-center mb-2">
        <span className="text-blue-300 font-semibold tracking-wider text-sm uppercase">第 {streak + 1} / 5 題</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 50, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -50, rotateX: 15 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="glass-panel text-white rounded-3xl shadow-2xl p-6 w-full border-t border-white/20"
        >
          <h2 className="text-2xl font-bold mb-8 text-center leading-tight drop-shadow-md">
            {currentQuestion.questionText}
          </h2>

          <div className="space-y-4">
            {currentQuestion.options.map((opt, idx) => {
               const isSelected = selectedOption === opt;
               const isCorrect = feedback === 'CORRECT';
               const isWrong = feedback === 'WRONG';
               
               let btnClass = "bg-white/5 border-white/10 hover:bg-white/10"; 
               if (isSelected) {
                 if (isCorrect) btnClass = "bg-green-500/20 border-green-400 text-green-300 shadow-[0_0_15px_rgba(74,222,128,0.3)]";
                 else if (isWrong) btnClass = "bg-red-500/20 border-red-400 text-red-300 shadow-[0_0_15px_rgba(248,113,113,0.3)]";
                 else btnClass = "bg-blue-500/20 border-blue-400 text-blue-300";
               }

               return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleOptionClick(opt)}
                  disabled={!!selectedOption}
                  className={`w-full p-4 rounded-2xl text-left font-semibold text-lg transition-all duration-300 border backdrop-blur-sm flex items-center justify-between group ${btnClass}`}
                >
                  <span>{opt}</span>
                  {isSelected && isCorrect && <CheckCircle2 className="w-6 h-6 text-green-400" />}
                  {isSelected && isWrong && <XCircle className="w-6 h-6 text-red-400" />}
                </motion.button>
               );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {feedback === 'WRONG' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-red-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]"
            >
              <div className="mx-auto bg-red-500/20 w-20 h-20 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-500/10">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-3xl font-extrabold text-white mb-2">答錯了！</h3>
              <p className="text-gray-400 mb-6">連勝中斷，重新開始！</p>
              
              <div className="bg-gray-800/50 rounded-xl p-4 mb-8 border border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2">正確答案是</p>
                <p className="text-xl font-bold text-green-400">{currentQuestion.correctAnswer}</p>
              </div>

              <button 
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:brightness-110 transition-all shadow-lg active:scale-95"
              >
                再試一次
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
