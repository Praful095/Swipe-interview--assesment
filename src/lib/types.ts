export type InterviewState = 
  | 'AWAITING_RESUME'
  | 'COLLECTING_INFO'
  | 'READY_TO_START'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type Message = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
};

export type Question = {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: number; // in seconds
};

export type Answer = {
  questionId: string;
  text: string;
  score?: number;
  feedback?: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  interviewState: InterviewState;
  messages: Message[];
  questions: Question[];
  answers: Answer[];
  finalScore: number;
  summary: string;
  createdAt: number;
};
