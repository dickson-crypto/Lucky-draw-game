import { Gift, Question, UserLog } from '../types';

/**
 * 部署說明 / DEPLOYMENT INSTRUCTIONS:
 * 
 * 目前模式：【測試模式 (Mock Data)】
 * 網站會使用下方的 MOCK_QUESTIONS 和 MOCK_GIFTS 資料。
 * 
 * 若要改為【正式模式 (Real Data)】：
 * 1. 設定好您的 Google Apps Script (GAS)。
 * 2. 將 REAL_API_URL 換成您的 GAS 網址。
 * 3. 將 USE_MOCK_DATA 改為 false。
 */

const USE_MOCK_DATA = true; // <--- 目前設定為 true，確保網站可直接運作
const REAL_API_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE'; 

// --- Mock Data (測試資料) ---

const MOCK_QUESTIONS: Question[] = [
    { id: 'q-1', questionText: '公務員事務局的主要職責是什麼？', options: ['管理公務員隊伍', '管理交通', '管理房屋', '管理醫院'].sort(() => Math.random() - 0.5), correctAnswer: '管理公務員隊伍' },
    { id: 'q-2', questionText: '以下哪項是職業安全的重要原則？', options: ['預防勝於治療', '發生意外才處理', '忽視潛在風險', '只顧工作效率'].sort(() => Math.random() - 0.5), correctAnswer: '預防勝於治療' },
    { id: 'q-3', questionText: '在使用電腦工作時，眼睛應與螢幕保持多少距離？', options: ['35-60 厘米', '10-20 厘米', '100 厘米以上', '越近越好'].sort(() => Math.random() - 0.5), correctAnswer: '35-60 厘米' },
    { id: 'q-4', questionText: '長時間工作後，應該做什麼來舒緩疲勞？', options: ['適當伸展運動', '繼續工作', '喝含糖飲料', '大聲呼叫'].sort(() => Math.random() - 0.5), correctAnswer: '適當伸展運動' },
    { id: 'q-5', questionText: '如果發現辦公室有潛在危險，應該怎麼做？', options: ['立即報告上級', '視而不見', '自行修理', '拍照放上網'].sort(() => Math.random() - 0.5), correctAnswer: '立即報告上級' }
];

const MOCK_GIFTS: Gift[] = [
  { id: 'g1', name: '精美環保袋', remainingStock: 50, image: '', color: 'bg-red-500' },
  { id: 'g2', name: '健康水樽', remainingStock: 30, image: '', color: 'bg-blue-500' },
  { id: 'g3', name: 'USB風扇', remainingStock: 20, image: '', color: 'bg-yellow-500' },
  { id: 'g4', name: '超市禮券', remainingStock: 5, image: '', color: 'bg-green-500' },
];

// --- Service Methods ---

export const generateUserId = (): string => {
  return 'user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
};

export const fetchQuestions = async (): Promise<Question[]> => {
  if (USE_MOCK_DATA) {
    // 模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 300));
    // 隨機選 5 題
    return [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
  }

  try {
    const response = await fetch(`${REAL_API_URL}?type=questions`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return MOCK_QUESTIONS; // Fallback to mock if fetch fails
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
    return MOCK_GIFTS;
  }
};

export const claimRedemptionCode = async (giftId?: string, userId?: string): Promise<string> => {
  if (USE_MOCK_DATA) {
    // 模擬產生兌換碼
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `WIN-${randomNum}`;
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