import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { XRayExecution } from '@/lib/xray';
import { ExecutionHeader } from './ExecutionHeader';
import { StepTimeline } from './StepTimeline';
import { StepDetail } from './StepDetail';
import { ExecutionList } from './ExecutionList';
import { FinalOutput } from './FinalOutput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Square, RotateCcw, Zap } from 'lucide-react';
import { useXRayDemo } from '@/hooks/useXRayDemo';

interface DashboardProps {
  executions: XRayExecution[];
  className?: string;
}

export function Dashboard({ executions, className }: DashboardProps) {
  const { isRunning, liveExecution, runDemo, stopDemo, resetDemo } = useXRayDemo();
  
  const [selectedExecution, setSelectedExecution] = useState<XRayExecution | null>(
    executions[0] || null
  );
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    executions[0]?.steps[0]?.id || null
  );

  // Auto-select live execution and latest step when running
  useEffect(() => {
    if (liveExecution) {
      setSelectedExecution(liveExecution);
      const latestStep = liveExecution.steps[liveExecution.steps.length - 1];
      if (latestStep) {
        setSelectedStepId(latestStep.id);
      }
    }
  }, [liveExecution]);

  const allExecutions = liveExecution 
    ? [liveExecution, ...executions.filter(e => e.id !== liveExecution.id)]
    : executions;

  const selectedStep = selectedExecution?.steps.find(s => s.id === selectedStepId);

  const handleSelectExecution = (execution: XRayExecution) => {
    setSelectedExecution(execution);
    setSelectedStepId(execution.steps[0]?.id || null);
  };

  return (
    <div className={cn('flex h-full', className)}>
      {/* Left Sidebar - Execution List */}
      <div className="w-80 border-r border-border/50 flex flex-col bg-surface-1/50">
        <div className="p-4 border-b border-border/50">
          <h1 className="text-xl font-bold text-gradient">X-Ray</h1>
          <p className="text-xs text-muted-foreground mt-1">Debug decision pipelines</p>
          
          {/* Run Demo Button */}
          <div className="mt-4 flex gap-2">
            {!isRunning ? (
              <Button 
                onClick={runDemo}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                size="sm"
              >
                <Play className="h-4 w-4" />
                Run Demo
              </Button>
            ) : (
              <Button 
                onClick={stopDemo}
                variant="destructive"
                className="flex-1 gap-2"
                size="sm"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}
            {liveExecution && !isRunning && (
              <Button 
                onClick={resetDemo}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isRunning && (
            <div className="mt-3 flex items-center gap-2 text-xs text-primary">
              <Zap className="h-3.5 w-3.5 animate-pulse" />
              <span>Pipeline running...</span>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 p-4">
          <ExecutionList 
            executions={allExecutions}
            selectedId={selectedExecution?.id}
            onSelect={handleSelectExecution}
          />
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedExecution ? (
          <>
            {/* Execution Header */}
            <div className="p-4 border-b border-border/50 bg-surface-1/30">
              <ExecutionHeader execution={selectedExecution} />
            </div>

            {/* Content Area */}
            <div className="flex-1 flex min-h-0">
              {/* Step Timeline */}
              <div className="w-72 border-r border-border/50 bg-surface-1/30">
                <ScrollArea className="h-full p-4">
                  <StepTimeline
                    steps={selectedExecution.steps}
                    selectedStepId={selectedStepId || undefined}
                    onSelectStep={setSelectedStepId}
                  />
                </ScrollArea>
              </div>

              {/* Step Detail */}
              <div className="flex-1 min-w-0">
                <ScrollArea className="h-full p-6">
                  <AnimatePresence mode="wait">
                    {selectedStep ? (
                      <StepDetail key={selectedStep.id} step={selectedStep} />
                    ) : selectedExecution.finalOutput ? (
                      <FinalOutput 
                        key="final"
                        output={selectedExecution.finalOutput as FinalOutput['output']} 
                      />
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center h-64 text-muted-foreground"
                      >
                        Select a step to view details
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Show Final Output at bottom if step is selected */}
                  {selectedStep && selectedExecution.finalOutput && selectedExecution.status === 'completed' && (
                    <div className="mt-6">
                      <FinalOutput output={selectedExecution.finalOutput as FinalOutput['output']} />
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No executions selected</p>
              <p className="text-sm mt-1">Select an execution from the sidebar to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Type fix for FinalOutput
type FinalOutput = {
  output: {
    selectedCompetitor?: {
      asin: string;
      title: string;
      price: number;
      rating: number;
      reviews: number;
    };
    pipelineMetrics?: {
      totalDuration: number;
      stepsCompleted: number;
      candidatesEvaluated: number;
      finalSelection: number;
    };
  };
};
