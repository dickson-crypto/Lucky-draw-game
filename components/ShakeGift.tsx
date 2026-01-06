import React, { useState, useEffect, useRef } from 'react';
import { Gift } from '../types';
import { motion, useAnimation } from 'framer-motion';
import { Gift as GiftIcon, Smartphone, Zap } from 'lucide-react';
import { pickRandomGift } from '../services/sheetService';

interface ShakeGiftProps {
  gifts: Gift[];
  onGiftRevealed: (gift: Gift) => void;
}

export const ShakeGift: React.FC<ShakeGiftProps> = ({ gifts, onGiftRevealed }) => {
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const boxControls = useAnimation();
  const progressRef = useRef(0);
  const [needsPermissionBtn, setNeedsPermissionBtn] = useState(false);

  useEffect(() => {
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      setNeedsPermissionBtn(true);
    } else {
      setPermissionGranted(true);
    }
  }, []);

  const requestAccess = async () => {
    try {
      const response = await (DeviceMotionEvent as any).requestPermission();
      if (response === 'granted') {
        setPermissionGranted(true);
        setNeedsPermissionBtn(false);
      } else {
        alert('我們需要感應器權限來偵測搖晃動作！');
      }
    } catch (e) {
      console.error(e);
      setPermissionGranted(true);
    }
  };

  useEffect(() => {
    if (!permissionGranted || isRevealing) return;

    let lastX = 0, lastY = 0, lastZ = 0, lastUpdate = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current) return;
      const { x, y, z } = current;
      const now = Date.now();

      if (now - lastUpdate > 100) {
        const diffTime = now - lastUpdate;
        lastUpdate = now;
        const speed = Math.abs((x || 0) + (y || 0) + (z || 0) - lastX - lastY - lastZ) / diffTime * 10000;

        if (speed > 300) {
          boxControls.start({
            rotate: [0, -15, 15, -15, 15, 0],
            scale: [1, 1.2, 1],
            transition: { duration: 0.15 }
          });
          
          const increment = Math.min(speed / 80, 8); 
          progressRef.current += increment;
          setShakeIntensity(Math.min(progressRef.current, 100));

          if (progressRef.current >= 100) handleComplete();
        }
        lastX = x || 0; lastY = y || 0; lastZ = z || 0;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [permissionGranted, isRevealing, boxControls]);

  const handleManualShake = () => {
    if (isRevealing) return;
    boxControls.start({
        rotate: [0, -20, 20, -20, 20, 0],
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 }
    });
    progressRef.current += 20;
    setShakeIntensity(Math.min(progressRef.current, 100));
    if (progressRef.current >= 100) handleComplete();
  };

  const handleComplete = () => {
    setIsRevealing(true);
    
    boxControls.start({
        scale: [1.2, 1.6, 0.5, 20], 
        rotate: [0, -20, 20, 360, 720],
        opacity: [1, 1, 1, 1, 0],
        transition: { duration: 1.2, ease: "easeInOut" }
    });

    const wonGift = pickRandomGift(gifts);
    if (wonGift) {
      setTimeout(() => onGiftRevealed(wonGift), 1000);
    } else {
      alert("所有禮物已換罄！");
    }
  };

  if (needsPermissionBtn && !permissionGranted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black/40 backdrop-blur-md">
        <div className="bg-white/10 p-6 rounded-full mb-6 ring-4 ring-blue-500/30">
             <Smartphone className="w-12 h-12 text-blue-400 animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">點擊啟用</h2>
        <p className="text-blue-200 mb-8 text-lg">我們需要感應器權限來進行搖晃遊戲！</p>
        <button onClick={requestAccess} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-2xl shadow-lg shadow-blue-500/40 transform transition active:scale-95">
          允許使用感應器
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-full py-12 px-6 relative overflow-hidden">
      
      <div className="absolute inset-0 pointer-events-none">
         {Array.from({length: 20}).map((_, i) => (
             <motion.div
                key={i}
                className="absolute bg-white/20 rounded-full"
                style={{
                    width: Math.random() * 6 + 2,
                    height: Math.random() * 6 + 2,
                    top: Math.random() * 100 + '%',
                    left: Math.random() * 100 + '%',
                }}
                animate={{
                    y: [0, -100],
                    opacity: [0, 1, 0]
                }}
                transition={{
                    duration: Math.random() * 5 + 5,
                    repeat: Infinity,
                    delay: Math.random() * 5
                }}
             />
         ))}
      </div>

      <div className="text-center z-10 mt-4">
        <h2 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">搖起來！</h2>
        <p className="text-blue-200 font-medium tracking-wide uppercase text-sm">用力搖晃手機以解鎖獎品</p>
      </div>

      <div className="relative w-full max-w-xs aspect-square flex items-center justify-center cursor-pointer z-10" onClick={handleManualShake}>
         <div className={`absolute inset-0 bg-gradient-to-tr from-yellow-500 to-pink-600 rounded-full filter blur-[60px] opacity-30 transition-opacity duration-300 ${shakeIntensity > 20 ? 'opacity-60' : ''}`}></div>

         <motion.div
            animate={boxControls}
            className="relative"
         >
             <div className="relative">
                 <GiftIcon 
                    className={`w-64 h-64 drop-shadow-2xl transition-colors duration-300 ${shakeIntensity > 70 ? 'text-yellow-300' : 'text-purple-300'}`} 
                    strokeWidth={1}
                 />
                 {shakeIntensity > 30 && (
                     <motion.div className="absolute -top-4 -right-4">
                         <Zap className="w-12 h-12 text-yellow-400 fill-yellow-400" />
                     </motion.div>
                 )}
             </div>
         </motion.div>
      </div>

      <div className="w-full max-w-xs z-10 mb-8">
        <div className="flex justify-between items-end mb-2">
            <span className="text-white font-bold text-lg uppercase italic">搖晃力度</span>
            <span className="text-yellow-400 font-mono text-xl">{Math.round(shakeIntensity)}%</span>
        </div>
        
        <div className="flex gap-1 h-8">
            {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="flex-1 bg-gray-800 rounded-sm overflow-hidden relative">
                    <motion.div 
                        className="w-full h-full bg-gradient-to-t from-yellow-500 to-red-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                        initial={{ height: '0%' }}
                        animate={{ height: shakeIntensity >= (i + 1) * 10 ? '100%' : '0%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                </div>
            ))}
        </div>
        <p className="text-center text-xs text-white/30 mt-4">(電腦版：點擊盒子測試)</p>
      </div>
    </div>
  );
};