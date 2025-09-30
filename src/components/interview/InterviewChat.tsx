import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Candidate, Message, Answer } from '@/lib/types';
import { generateInterviewQuestions, generateFinalScoreAndSummary } from '@/lib/ai';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Loader2, Send, User, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '../ui/badge';

interface Props {
  candidate: Candidate;
}

const InterviewChat: React.FC<Props> = ({ candidate }) => {
  const { updateCandidate, addMessage, setQuestions, setActiveTab } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestionIndex = candidate.answers.length;
  const currentQuestion = candidate.questions[currentQuestionIndex];
  const isInterviewOver = currentQuestionIndex >= candidate.questions.length && candidate.questions.length > 0;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [candidate.messages, isAnalyzing]);

  const handleSubmitAnswer = useCallback((isTimeUp = false) => {
    if (!currentQuestion || candidate.answers.find(a => a.questionId === currentQuestion.id)) {
      return;
    }

    const answerText = currentAnswer.trim() || '(No answer provided)';
    const newAnswer: Answer = { questionId: currentQuestion.id, text: answerText };
    const userMessage: Message = { id: uuidv4(), sender: 'user', text: answerText, timestamp: Date.now() };

    const nextAnswers = [...candidate.answers, newAnswer];
    const nextMessages = [...candidate.messages, userMessage];
    
    let updates: Partial<Candidate> = { answers: nextAnswers, messages: nextMessages };

    if (nextAnswers.length < candidate.questions.length) {
      const nextQuestion = candidate.questions[nextAnswers.length];
      nextMessages.push({ id: uuidv4(), sender: 'ai', text: nextQuestion.text, timestamp: Date.now() });
    } else {
      nextMessages.push({ id: uuidv4(), sender: 'ai', text: "Thank you for completing the interview! I will now analyze your responses.", timestamp: Date.now() });
      updates.interviewState = 'COMPLETED';
    }
    
    if (isTimeUp) {
      toast.info("Time's up! Submitting your answer.");
    }

    updateCandidate(candidate.id, updates);
    setCurrentAnswer('');
  }, [candidate, currentQuestion, currentAnswer, updateCandidate]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (candidate.interviewState !== 'IN_PROGRESS' || !currentQuestion) {
      return;
    }

    setTimeLeft(currentQuestion.duration);

    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmitAnswer(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestion, candidate.interviewState, handleSubmitAnswer]);

  useEffect(() => {
    if (isInterviewOver && candidate.interviewState === 'COMPLETED' && !candidate.summary && !isAnalyzing) {
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        const analysisToast = toast.loading('AI is analyzing your answers...');
        try {
          const result = await generateFinalScoreAndSummary(candidate);
          const updatedAnswers = candidate.answers.map(ans => {
            const feedback = result.answerFeedback.find((f: any) => f.questionId === ans.questionId);
            return feedback ? { ...ans, score: feedback.score, feedback: feedback.feedback } : ans;
          });
          updateCandidate(candidate.id, { 
            finalScore: result.finalScore,
            summary: result.summary,
            answers: updatedAnswers,
          });
          toast.success(`Analysis complete! Final score: ${result.finalScore}/100`, { id: analysisToast });
        } catch (e) {
          const error = e instanceof Error ? e.message : "An unknown error occurred during analysis.";
          toast.error(error, { id: analysisToast });
          console.error(e);
        } finally {
          setIsAnalyzing(false);
        }
      };
      runAnalysis();
    }
  }, [isInterviewOver, candidate, updateCandidate, isAnalyzing]);

  const handleStartInterview = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Generating interview questions...');
    try {
      const questions = await generateInterviewQuestions(candidate.resumeText);
      setQuestions(candidate.id, questions);
      const firstQuestionMessage: Message = {
        id: uuidv4(),
        sender: 'ai',
        text: `Let's begin. Here is your first question:\n\n${questions[0].text}`,
        timestamp: Date.now(),
      };
      addMessage(candidate.id, firstQuestionMessage);
      updateCandidate(candidate.id, { interviewState: 'IN_PROGRESS' });
      toast.success('Interview started! Good luck.', { id: toastId });
    } catch (error) {
      toast.error('Failed to generate questions. Please try again.', { id: toastId });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    handleSubmitAnswer(false);
  };

  if (candidate.interviewState === 'READY_TO_START') {
    return (
      <Card className="w-full max-w-2xl mx-auto text-center animate-in fade-in duration-500">
        <CardHeader>
          <CardTitle>You're All Set, {candidate.name}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6">The interview consists of 6 questions with varying difficulty and timers. Are you ready to begin?</p>
          <Button onClick={handleStartInterview} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 animate-spin" /> : null}
            {isLoading ? 'Preparing...' : 'Start Interview'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isInterviewOver && candidate.interviewState === 'COMPLETED') {
    return (
        <Card className="w-full max-w-2xl mx-auto text-center">
            <CardHeader>
                <CardTitle>Interview Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>Thank you for your time, {candidate.name}.</p>
                {isAnalyzing && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="animate-spin"/>
                        <span>AI is analyzing your results...</span>
                    </div>
                )}
                {candidate.summary && (
                    <div className="p-4 bg-muted rounded-lg text-left space-y-4 animate-in fade-in">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="text-primary" /> AI Summary & Score</h3>
                        <p className="text-sm text-muted-foreground">{candidate.summary}</p>
                        <div className="text-center">
                            <p className="text-sm">Final Score</p>
                            <p className="text-4xl font-bold">{candidate.finalScore} <span className="text-lg text-muted-foreground">/ 100</span></p>
                        </div>
                         <Button onClick={() => setActiveTab('interviewer')} className="w-full">
                            View Full Dashboard
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-[70vh] flex flex-col">
      <CardHeader>
        <CardTitle>Full Stack Interview</CardTitle>
        <div className="flex items-center gap-4 pt-2">
          <Progress value={(currentQuestionIndex / candidate.questions.length) * 100} className="w-full" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">{currentQuestionIndex} / {candidate.questions.length}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          {candidate.messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 my-4 ${message.sender === 'user' ? 'justify-end' : ''}`}>
              {message.sender === 'ai' && <Avatar><AvatarFallback><Bot size={20} /></AvatarFallback></Avatar>}
              <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.sender === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
              {message.sender === 'user' && <Avatar><AvatarFallback><User size={20} /></AvatarFallback></Avatar>}
            </div>
          ))}
           {isLoading && <div className="flex items-start gap-3 my-4"><Avatar><AvatarFallback><Bot size={20} /></AvatarFallback></Avatar><Skeleton className="h-12 w-3/4" /></div>}
        </ScrollArea>
      </CardContent>
      <Separator />
      <CardFooter className="p-4 flex flex-col items-start gap-2">
        {currentQuestion && (
            <div className="w-full flex justify-between items-center text-sm">
                <Badge variant={currentQuestion.difficulty === 'Easy' ? 'secondary' : currentQuestion.difficulty === 'Medium' ? 'default' : 'destructive'}>{currentQuestion.difficulty}</Badge>
                <div className="font-mono bg-muted px-2 py-1 rounded-md">
                    Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
            </div>
        )}
        <div className="w-full flex items-center gap-2">
          <Textarea placeholder="Type your answer here..." value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleManualSubmit(); } }} className="flex-grow" rows={2} disabled={!currentQuestion} />
          <Button size="icon" onClick={handleManualSubmit} disabled={!currentQuestion || !currentAnswer}>
            <Send />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default InterviewChat;
