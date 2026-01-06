import { Gift, Question, UserLog } from '../types';

/**
 * 部署說明 / DEPLOYMENT INSTRUCTIONS:
 * 
 * 1. 把 USE_MOCK_DATA 改為 false。
 * 2. 將下方的 REAL_API_URL 替換為您的 Google Apps Script 部署網址 (Web App URL)。
 */

const USE_MOCK_DATA = false; 
const REAL_API_URL = 'https://script.google.com/macros/s/AKfycbyVf2DamWzPsWdRTGvDE0ucBe_2tjzYSf2nXly8QJpa8LwYrpUIDCgroFj9i-FXg4WZ/exec'; 

// --- Mock Data (Fallback) ---

const MOCK_QUESTIONS: Question[] = [
    { id: 'q-1', questionText: '香蕉通常是什麼顏色的？', options: ['紅色', '藍色', '黃色', '綠色'].sort(() => Math.random() - 0.5), correctAnswer: '黃色' },
    { id: 'q-2', questionText: '蘋果通常是什麼顏色的？', options: ['紅色', '藍色', '黑色', '紫色'].sort(() => Math.random() - 0.5), correctAnswer: '紅色' },
    { id: 'q-3', questionText: '天空通常是什麼顏色的？', options: ['橙色', '藍色', '綠色', '黃色'].sort(() => Math.random() - 0.5), correctAnswer: '藍色' },
    { id: 'q-4', questionText: '草地通常是什麼顏色的？', options: ['紅色', '白色', '黃色', '綠色'].sort(() => Math.random() - 0.5), correctAnswer: '綠色' },
    { id: 'q-5', questionText: '一年有多少個月？', options: ['10個', '12個', '15個', '8個'].sort(() => Math.random() - 0.5), correctAnswer: '12個' }
];

const MOCK_GIFTS: Gift[] = [
  { id: 'g1', name: '高級環保袋', remainingStock: 100, image: '', color: 'bg-red-500' },
  { id: 'g2', name: '精美保溫瓶', remainingStock: 100, image: '', color: 'bg-blue-500' },
  { id: 'g3', name: '無線充電器', remainingStock: 95, image: '', color: 'bg-yellow-500' },
  { id: 'g4', name: '超市現金券', remainingStock: 5, image: '', color: 'bg-green-500' },
];

// --- Service Methods ---

export const generateUserId = (): string => {
  return 'user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
};

export const fetchQuestions = async (): Promise<Question[]> => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const extended = Array.from({ length: 10 }).flatMap(() => MOCK_QUESTIONS).map((q, i) => ({...q, id: `q-${i}`}));
    return extended.sort(() => Math.random() - 0.5);
  }

  try {
    const response = await fetch(`${REAL_API_URL}?type=questions`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return [];
  }
};

export const fetchGifts = async (): Promise<Gift[]> => {
  if (USE_MOCK_DATA) return MOCK_GIFTS;

  try {
    const response = await fetch(`${REAL_API_URL}?type=gifts`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch gifts:", error);
    return [];
  }
};

export const claimRedemptionCode = async (giftId?: string, userId?: string): Promise<string> => {
  if (USE_MOCK_DATA) {
    const stored = localStorage.getItem('mock_gift_sequence');
    let nextNum = stored ? parseInt(stored, 10) + 1 : 1;
    if (nextNum > 400) nextNum = 1;
    localStorage.setItem('mock_gift_sequence', nextNum.toString());
    return `TEST-${String(nextNum).padStart(3, '0')}`;
  }

  try {
    const response = await fetch(REAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'CLAIM',
        giftId: giftId,
        userId: userId
      })
    });
    
    const result = await response.json();
    if (result.error) {
      console.error("Claim error:", result.error);
      return "ERROR-RETRY"; 
    }
    return result.code;
    
  } catch (error) {
    console.error("Failed to claim code:", error);
    return "NET-ERR";
  }
};

export const logUserAction = async (log: UserLog): Promise<void> => {
  console.log('[LOG]', log);
  
  if (!USE_MOCK_DATA) {
    try {
      await fetch(REAL_API_URL, {
        method: 'POST',
         headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'LOG',
          logAction: log.action, 
          userId: log.userId,
          details: log.details
        })
      });
    } catch (e) {
      console.error("Logging failed", e);
    }
  }
};

export const pickRandomGift = (gifts: Gift[]): Gift | null => {
  const availableGifts = gifts.filter(g => g.remainingStock > 0);
  if (availableGifts.length === 0) return null;

  const totalWeight = availableGifts.reduce((sum, gift) => sum + gift.remainingStock, 0);
  let randomPoint = Math.random() * totalWeight;
  
  for (const gift of availableGifts) {
    if (randomPoint < gift.remainingStock) {
      return gift;
    }
    randomPoint -= gift.remainingStock;
  }
  return availableGifts[availableGifts.length - 1];
};