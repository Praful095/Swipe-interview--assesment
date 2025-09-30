import { Toaster } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntervieweeView from '@/pages/IntervieweeView';
import InterviewerDashboard from '@/pages/InterviewerDashboard';
import { useStore } from '@/store/useStore';
import { ModeToggle } from './components/theme-toggle';

function App() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Crisp AI Interview</h1>
        <ModeToggle />
      </header>
      <main>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'interviewee' | 'interviewer')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="interviewee">Interviewee</TabsTrigger>
            <TabsTrigger value="interviewer">Interviewer</TabsTrigger>
          </TabsList>
          <TabsContent value="interviewee" className="mt-6">
            <IntervieweeView />
          </TabsContent>
          <TabsContent value="interviewer" className="mt-6">
            <InterviewerDashboard />
          </TabsContent>
        </Tabs>
      </main>
      <Toaster richColors />
    </div>
  );
}

export default App;
