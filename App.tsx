import React, { useState, useEffect } from 'react';
import { AppState, Gift, Question, UserLog } from './types';
import { fetchGifts, fetchQuestions, generateUserId, logUserAction, claimRedemptionCode } from './services/sheetService';
import { QuizGame } from './components/QuizGame';
import { ShakeGift } from './components/ShakeGift';
import { Loader2, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [currentGift, setCurrentGift] = useState<Gift | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [redemptionCode, setRedemptionCode] = useState<string>('---');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const uid = generateUserId();
      setUserId(uid);
      const [qs, gs] = await Promise.all([fetchQuestions(), fetchGifts()]);
      setQuestions(qs);
      setGifts(gs);
      setIsLoading(false);
      logUserAction({ userId: uid, timestamp: new Date().toISOString(), action: 'START' });
    };
    init();
  }, []);

  const handleLog = (action: string, details: string) => {
    logUserAction({
      userId,
      timestamp: new Date().toISOString(),
      action: action as any,
      details
    });
  };

  const handleGameWin = () => {
    setAppState(AppState.SHAKE);
    handleLog('WIN_GAME', 'Streak 5 reached');
  };

  const handleGiftRevealed = async (gift: Gift) => {
    setCurrentGift(gift);
    // Fetch unique code from backend
    const code = await claimRedemptionCode(gift.id, userId);
    setRedemptionCode(code);
    
    setAppState(AppState.REDEEM);
    handleLog('REDEEM_GIFT', `GiftID:${gift.id} | Code:${code}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0c29] flex items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-fuchsia-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans overflow-hidden relative text-white bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] animate-gradient-xy">
      
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      <div className="relative z-10 h-full flex flex-col">
        {appState === AppState.WELCOME && (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              {/* Logo Section */}
              <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-fuchsia-500/20 blur-[50px] rounded-full animate-pulse"></div>
                
                {/* Image Container */}
                <div className="relative w-full h-full p-2 transition-transform duration-500 hover:scale-105">
                     <img 
                        src="./logo.png" 
                        alt="Event Logo" 
                        className="w-full h-full object-contain drop-shadow-2xl"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            // Fallback text if image not found
                            const parent = e.currentTarget.parentElement;
                            if (parent) parent.innerHTML = '<div class="text-white text-xs border border-white/20 p-2 rounded">請上傳 logo.png</div>';
                        }}
                     />
                </div>
              </div>
              
              <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] leading-tight">
                有獎<br/>問答遊戲
              </h1>
              
              <p className="text-indigo-200 mb-10 text-lg font-light leading-relaxed">
                根據展覽內容, 連續答對五題<br/>
                即可解鎖<span className="text-yellow-300 font-bold">神秘禮物</span>!
              </p>
              
              <button
                onClick={() => setAppState(AppState.QUIZ)}
                className="w-full bg-white text-[#0f0c29] font-black text-xl py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                立即開始
                <motion.span 
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >→</motion.span>
              </button>

              <div className="mt-12 grid grid-cols-4 gap-4 opacity-60">
                {gifts.slice(0, 4).map((g) => (
                   <div key={g.id} className="flex justify-center">
                      <div className={`w-3 h-3 rounded-full ${g.color}`}></div>
                   </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {appState === AppState.QUIZ && (
          <div className="min-h-screen py-8">
            <QuizGame 
              questions={questions} 
              onWin={handleGameWin}
              onLog={handleLog}
            />
          </div>
        )}

        {appState === AppState.SHAKE && (
           <div className="h-screen w-full absolute inset-0">
             <ShakeGift gifts={gifts} onGiftRevealed={handleGiftRevealed} />
           </div>
        )}

        {appState === AppState.REDEEM && currentGift && (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
             <motion.div
               initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
               animate={{ scale: 1, opacity: 1, rotateY: 0 }}
               transition={{ type: "spring", damping: 12 }}
               className="w-full max-w-sm"
             >
                {/* Holographic Ticket Style */}
                <div className="bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 p-[2px] rounded-3xl shadow-[0_0_60px_rgba(234,179,8,0.4)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                    <div className="bg-[#1a1a1a] rounded-[22px] p-8 relative overflow-hidden">
                        {/* Shimmer Effect */}
                        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-[shimmer_3s_infinite]"></div>

                        <div className="mb-6 flex justify-center">
                            <div className={`w-24 h-24 rounded-full ${currentGift.color} flex items-center justify-center shadow-lg ring-4 ring-white/10`}>
                                <Ticket className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        <div className="uppercase tracking-widest text-yellow-500 text-xs font-bold mb-2">中獎禮券</div>
                        <h2 className="text-3xl font-black text-white leading-none mb-4">{currentGift.name}</h2>
                        
                        <div className="my-6 border-t border-dashed border-gray-700 w-full h-1"></div>

                        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">換領編號</p>
                            <p className="font-mono text-2xl font-black text-yellow-400 break-all tracking-widest">{redemptionCode}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-indigo-200 text-sm">
                    <p className="animate-pulse">請向工作人員出示此畫面領獎。</p>
                </div>
             </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;