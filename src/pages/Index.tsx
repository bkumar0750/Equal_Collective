import { Dashboard } from '@/components/xray/Dashboard';
import { mockExecutions } from '@/data/mockExecution';

const Index = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <Dashboard executions={mockExecutions} className="h-full" />
    </div>
  );
};

export default Index;
