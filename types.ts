export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string; // The exact string of the correct option
}

export interface Gift {
  id: string;
  name: string;
  image: string; // placeholder URL
  remainingStock: number;
  color: string;
}

export interface UserLog {
  userId: string;
  timestamp: string;
  action: 'START' | 'ANSWER_CORRECT' | 'ANSWER_WRONG' | 'WIN_GAME' | 'REDEEM_GIFT';
  details?: string; // e.g., Question ID, Gift ID
}

export enum AppState {
  WELCOME = 'WELCOME',
  QUIZ = 'QUIZ',
  FAILED = 'FAILED', // Temporary state when answering wrong
  SHAKE = 'SHAKE',
  REDEEM = 'REDEEM'
}