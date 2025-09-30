import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { parseResume } from '@/lib/resume-parser';
import { Candidate, InterviewState } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import CollectInfoForm from '@/components/interview/CollectInfoForm';
import InterviewChat from '@/components/interview/InterviewChat';
import WelcomeBackModal from '@/components/interview/WelcomeBackModal';

const ResumeUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { addCandidate, setCurrentCandidateId, updateCandidate } = useStore();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      toast.error('Invalid file type. Please upload a PDF or DOCX.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Parsing your resume...');
    try {
      const { text, details } = await parseResume(file);
      const candidateId = uuidv4();
      
      const newCandidate: Candidate = {
        id: candidateId,
        name: details.name || '',
        email: details.email || '',
        phone: details.phone || '',
        resumeText: text,
        interviewState: 'AWAITING_RESUME',
        messages: [],
        questions: [],
        answers: [],
        finalScore: 0,
        summary: '',
        createdAt: Date.now(),
      };

      addCandidate(newCandidate);
      setCurrentCandidateId(candidateId);
      
      const missingFields = !details.name || !details.email || !details.phone;
      const nextState: InterviewState = missingFields ? 'COLLECTING_INFO' : 'READY_TO_START';
      
      updateCandidate(candidateId, { interviewState: nextState });

      toast.success('Resume parsed successfully!', { id: toastId });

    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse resume.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto animate-in fade-in duration-500">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">AI Interview Assistant</CardTitle>
        <CardDescription>Upload your resume to begin. We accept PDF and DOCX.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 items-center">
          <Input id="resume-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx" disabled={isLoading} />
          <label htmlFor="resume-upload" className="w-full">
            <Button asChild className="w-full cursor-pointer" disabled={isLoading}>
              <div>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                <span>{isLoading ? 'Parsing Resume...' : 'Upload Resume'}</span>
              </div>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">Your interview will start after your details are confirmed.</p>
        </div>
      </CardContent>
    </Card>
  );
};


const IntervieweeView = () => {
    const { currentCandidateId, candidates, resetInterview } = useStore();
    const candidate = currentCandidateId ? candidates[currentCandidateId] : null;
    const [showWelcomeBack, setShowWelcomeBack] = useState(false);

    useEffect(() => {
        if (candidate && candidate.interviewState === 'IN_PROGRESS') {
            setShowWelcomeBack(true);
        }
    }, [candidate]);

    const handleStartOver = () => {
        if (currentCandidateId) {
            resetInterview(currentCandidateId);
        }
        setShowWelcomeBack(false);
    };

    const renderContent = () => {
        if (!candidate || candidate.interviewState === 'AWAITING_RESUME') {
            return <ResumeUpload />;
        }
        
        switch (candidate.interviewState) {
            case 'COLLECTING_INFO':
                return <CollectInfoForm candidate={candidate} />;
            case 'READY_TO_START':
            case 'IN_PROGRESS':
            case 'COMPLETED':
                return <InterviewChat candidate={candidate} />;
            default:
                return <ResumeUpload />;
        }
    };

    return (
        <>
            <WelcomeBackModal
                isOpen={showWelcomeBack}
                onClose={() => setShowWelcomeBack(false)}
                onStartOver={handleStartOver}
            />
            {renderContent()}
        </>
    );
};

export default IntervieweeView;
