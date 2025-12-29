import { Clock, Tag, ArrowLeft, ExternalLink } from 'lucide-react';
import type { XRayExecution } from '@/lib/xray';
import { StepStatusBadge } from './StepIcon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExecutionHeaderProps {
  execution: XRayExecution;
  onBack?: () => void;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function ExecutionHeader({ execution, onBack }: ExecutionHeaderProps) {
  const duration = execution.endTime 
    ? execution.endTime - execution.startTime 
    : Date.now() - execution.startTime;

  return (
    <div className="glass-panel p-6 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {onBack && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {execution.name}
            </h1>
            {execution.description && (
              <p className="text-muted-foreground text-sm max-w-2xl">
                {execution.description}
              </p>
            )}
          </div>
        </div>
        <StepStatusBadge status={execution.status} />
      </div>

      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Started {formatTime(execution.startTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground font-mono font-medium">
            {formatDuration(duration)}
          </span>
          <span>total duration</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground font-mono font-medium">
            {execution.steps.length}
          </span>
          <span>steps</span>
        </div>
      </div>

      {execution.tags && execution.tags.length > 0 && (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {execution.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary"
                className="text-xs font-mono"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {execution.context && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Context</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(execution.context).slice(0, 3).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-muted-foreground">{key}: </span>
                <span className="text-foreground font-mono">
                  {typeof value === 'object' 
                    ? (value as { title?: string })?.title || JSON.stringify(value).slice(0, 30) 
                    : String(value).slice(0, 30)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
