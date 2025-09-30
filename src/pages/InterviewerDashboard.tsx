import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Candidate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import CandidateDetailDialog from '@/components/interviewer/CandidateDetailDialog';

const InterviewerDashboard = () => {
  const { candidates } = useStore();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  const candidateList = Object.values(candidates).sort((a, b) => b.finalScore - a.finalScore);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Candidate Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidateList.length > 0 ? (
                candidateList.map((candidate) => (
                  <TableRow key={candidate.id} onClick={() => setSelectedCandidate(candidate)} className="cursor-pointer">
                    <TableCell className="font-medium">{candidate.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={candidate.interviewState === 'COMPLETED' ? 'default' : 'secondary'}>
                        {candidate.interviewState.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{candidate.finalScore > 0 ? `${candidate.finalScore} / 100` : 'N/A'}</TableCell>
                    <TableCell>{format(new Date(candidate.createdAt), 'PP')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No candidates yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedCandidate && (
        <CandidateDetailDialog 
            candidate={selectedCandidate}
            isOpen={!!selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
        />
      )}
    </>
  );
};

export default InterviewerDashboard;
