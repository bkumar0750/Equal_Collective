import { motion } from 'framer-motion';
import type { XRayExecution } from '@/lib/xray';
import { StepStatusBadge } from './StepIcon';
import { cn } from '@/lib/utils';
import { Clock, ChevronRight, Activity } from 'lucide-react';

interface ExecutionListProps {
  executions: XRayExecution[];
  selectedId?: string;
  onSelect: (execution: XRayExecution) => void;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function ExecutionList({ executions, selectedId, onSelect }: ExecutionListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Executions
        </h2>
        <span className="text-xs text-muted-foreground">{executions.length} total</span>
      </div>
      
      <div className="space-y-2">
        {executions.map((execution, index) => {
          const isSelected = execution.id === selectedId;
          const duration = execution.endTime 
            ? execution.endTime - execution.startTime 
            : Date.now() - execution.startTime;

          return (
            <motion.button
              key={execution.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(execution)}
              className={cn(
                'w-full text-left p-4 rounded-lg transition-all duration-200',
                'border hover:bg-surface-hover group',
                isSelected 
                  ? 'bg-surface-2 border-primary/30 ring-1 ring-primary/20' 
                  : 'bg-surface-1 border-border/50'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-medium text-sm truncate',
                      isSelected ? 'text-foreground' : 'text-foreground/90'
                    )}>
                      {execution.name}
                    </span>
                  </div>
                  
                  {execution.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {execution.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(execution.startTime)}
                    </span>
                    <span className="font-mono">
                      {formatDuration(duration)}
                    </span>
                    <span>
                      {execution.steps.length} steps
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StepStatusBadge status={execution.status} />
                  <ChevronRight className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    'group-hover:translate-x-0.5',
                    isSelected && 'text-primary'
                  )} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
