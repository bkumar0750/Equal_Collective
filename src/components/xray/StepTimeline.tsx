import { motion } from 'framer-motion';
import type { XRayStep } from '@/lib/xray';
import { StepIcon, StepStatusBadge } from './StepIcon';
import { cn } from '@/lib/utils';
import { ChevronRight, Clock, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface StepTimelineProps {
  steps: XRayStep[];
  selectedStepId?: string;
  onSelectStep: (stepId: string) => void;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function StepTimeline({ steps, selectedStepId, onSelectStep }: StepTimelineProps) {
  const failedCount = steps.filter(s => s.status === 'failed').length;
  const completedCount = steps.filter(s => s.status === 'completed').length;
  
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-2 mb-2">
        Execution Steps
      </h2>
      
      {/* Summary bar - emphasize failures */}
      <div className="flex items-center gap-3 px-2 mb-4 text-xs">
        {failedCount > 0 && (
          <div className="flex items-center gap-1.5 text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-full border border-destructive/20">
            <XCircle className="h-3 w-3" />
            <span>{failedCount} failed</span>
          </div>
        )}
        {completedCount > 0 && (
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="h-3 w-3" />
            <span>{completedCount} completed</span>
          </div>
        )}
      </div>

      <div className="relative">
        {steps.map((step, index) => {
          const isSelected = step.id === selectedStepId;
          const isLast = index === steps.length - 1;
          const isFailed = step.status === 'failed';
          const hasFailedFilter = step.metrics?.failedCount && step.metrics.failedCount > 0;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {!isLast && (
                <div className={cn(
                  "absolute left-[23px] top-[52px] h-[calc(100%-28px)] w-px",
                  isFailed 
                    ? "bg-destructive/50" 
                    : "bg-gradient-to-b from-border to-border/30"
                )} />
              )}

              <button
                onClick={() => onSelectStep(step.id)}
                className={cn(
                  'w-full flex items-start gap-4 p-3 rounded-lg text-left transition-all duration-200',
                  'hover:bg-surface-hover group',
                  isSelected && 'bg-surface-2 ring-1 ring-primary/30',
                  // Emphasize failures
                  isFailed && !isSelected && 'bg-destructive/5 border border-destructive/20 ring-1 ring-destructive/10'
                )}
              >
                <StepIcon type={step.type} status={step.status} size="md" />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-medium text-sm',
                      isSelected ? 'text-foreground' : 'text-foreground/80',
                      isFailed && 'text-destructive'
                    )}>
                      {step.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono uppercase">
                      {step.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {step.status === 'running' ? (
                      <div className="flex items-center gap-1 text-primary">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : isFailed ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{step.error || 'Step failed'}</span>
                      </div>
                    ) : (
                      <>
                        {step.metrics?.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="font-mono">{formatDuration(step.metrics.duration)}</span>
                          </div>
                        )}
                        {step.metrics?.inputCount !== undefined && (
                          <span>
                            <span className="font-mono text-foreground/70">{step.metrics.inputCount}</span> in
                          </span>
                        )}
                        {step.metrics?.outputCount !== undefined && (
                          <span>
                            <span className="font-mono text-foreground/70">{step.metrics.outputCount}</span> out
                          </span>
                        )}
                        {/* Show filter failure count */}
                        {hasFailedFilter && (
                          <span className="text-amber-500 flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            <span className="font-mono">{step.metrics?.failedCount}</span> rejected
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  isSelected && 'text-primary rotate-90',
                  'group-hover:text-foreground'
                )} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
