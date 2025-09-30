import React from 'react';
import { Candidate } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, User, Mail, Phone, FileText, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
}

const CandidateDetailDialog: React.FC<Props> = ({ isOpen, onClose, candidate }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{candidate.name}</DialogTitle>
          <DialogDescription>
            Interview completed on {format(new Date(candidate.createdAt), 'PPP')}
          </DialogDescription>
          <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Mail size={14}/> {candidate.email}</span>
            <span className="flex items-center gap-2"><Phone size={14}/> {candidate.phone}</span>
          </div>
        </DialogHeader>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow overflow-hidden">
            <div className="md:col-span-1 flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2"><Sparkles className="text-primary"/> AI Evaluation</h3>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm">Final Score</p>
                    <p className="text-5xl font-bold">{candidate.finalScore} <span className="text-xl text-muted-foreground">/ 100</span></p>
                    <p className="text-sm pt-2 text-muted-foreground">{candidate.summary || "AI summary is being generated."}</p>
                </div>
                <h3 className="font-semibold flex items-center gap-2 pt-4"><FileText className="text-primary"/> Resume</h3>
                <ScrollArea className="h-48 border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{candidate.resumeText}</p>
                </ScrollArea>
            </div>
            <div className="md:col-span-2 flex flex-col">
                <h3 className="font-semibold mb-2">Interview Transcript</h3>
                <ScrollArea className="flex-grow border rounded-lg p-3">
                    {candidate.messages.map((message) => (
                        <div key={message.id} className={`flex items-start gap-3 my-4 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                            {message.sender === 'ai' && <div className="p-2 bg-secondary rounded-full"><Bot size={16} /></div>}
                            <div className={`rounded-lg px-4 py-2 max-w-[85%] ${message.sender === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                {message.sender === 'user' && (
                                    (() => {
                                        const answer = candidate.answers.find(a => a.text === message.text);
                                        const question = answer ? candidate.questions.find(q => q.id === answer.questionId) : null;
                                        const feedback = answer ? candidate.answers.find(a => a.questionId === answer.questionId) : null;
                                        if (question && feedback && feedback.feedback) {
                                            return (
                                                <>
                                                    <Separator className="my-2 bg-primary/20"/>
                                                    <p className="text-xs opacity-80">Feedback: {feedback.feedback} <Badge variant="secondary" className="ml-2">Score: {feedback.score}/10</Badge></p>
                                                </>
                                            )
                                        }
                                        return null;
                                    })()
                                )}
                            </div>
                            {message.sender === 'user' && <div className="p-2 bg-secondary rounded-full"><User size={16} /></div>}
                        </div>
                    ))}
                </ScrollArea>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetailDialog;
