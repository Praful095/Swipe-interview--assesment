import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartOver: () => void;
}

const WelcomeBackModal: React.FC<Props> = ({ isOpen, onClose, onStartOver }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Welcome Back!</AlertDialogTitle>
          <AlertDialogDescription>
            It looks like you have an interview in progress. You can resume where you left off or start over with a new session.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="destructive" onClick={onStartOver}>Start Over</Button>
          <AlertDialogAction onClick={onClose}>Resume Interview</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WelcomeBackModal;
