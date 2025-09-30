import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Candidate, InterviewState, Question, Answer, Message } from '@/lib/types';

interface AppState {
  candidates: Record<string, Candidate>;
  currentCandidateId: string | null;
  activeTab: 'interviewee' | 'interviewer';
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  setCurrentCandidateId: (id: string | null) => void;
  setActiveTab: (tab: 'interviewee' | 'interviewer') => void;
  addMessage: (candidateId: string, message: Message) => void;
  setQuestions: (candidateId: string, questions: Question[]) => void;
  addAnswer: (candidateId: string, answer: Answer) => void;
  resetInterview: (candidateId: string) => void;
  resetState: () => void;
}

const initialState = {
  candidates: {},
  currentCandidateId: null,
  activeTab: 'interviewee' as 'interviewee' | 'interviewer',
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      addCandidate: (candidate) =>
        set((state) => ({
          candidates: { ...state.candidates, [candidate.id]: candidate },
        })),
      updateCandidate: (id, updates) =>
        set((state) => {
          const candidate = state.candidates[id];
          if (candidate) {
            return {
              candidates: {
                ...state.candidates,
                [id]: { ...candidate, ...updates },
              },
            };
          }
          return state;
        }),
      setCurrentCandidateId: (id) => set({ currentCandidateId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      addMessage: (candidateId, message) =>
        set((state) => {
          const candidate = state.candidates[candidateId];
          if (candidate) {
            return {
              candidates: {
                ...state.candidates,
                [candidateId]: {
                  ...candidate,
                  messages: [...candidate.messages, message],
                },
              },
            };
          }
          return state;
        }),
      setQuestions: (candidateId, questions) =>
        set((state) => {
            const candidate = state.candidates[candidateId];
            if (candidate) {
                return {
                    candidates: {
                        ...state.candidates,
                        [candidateId]: { ...candidate, questions },
                    },
                };
            }
            return state;
        }),
      addAnswer: (candidateId, answer) =>
        set((state) => {
            const candidate = state.candidates[candidateId];
            if (candidate) {
                return {
                    candidates: {
                        ...state.candidates,
                        [candidateId]: {
                            ...candidate,
                            answers: [...candidate.answers, answer],
                        },
                    },
                };
            }
            return state;
        }),
      resetInterview: (candidateId) =>
        set((state) => {
            const candidate = state.candidates[candidateId];
            if (candidate) {
                return {
                    candidates: {
                        ...state.candidates,
                        [candidateId]: {
                            ...candidate,
                            interviewState: 'AWAITING_RESUME',
                            messages: [],
                            questions: [],
                            answers: [],
                            finalScore: 0,
                            summary: '',
                        },
                    },
                    currentCandidateId: null,
                };
            }
            return state;
        }),
      resetState: () => set(initialState),
    }),
    {
      name: 'ai-interview-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
