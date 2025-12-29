import { motion, AnimatePresence } from 'framer-motion';
import type { XRayStep, CandidateEvaluation } from '@/lib/xray';
import { StepIcon, StepStatusBadge } from './StepIcon';
import { cn } from '@/lib/utils';
import { 
  Lightbulb, 
  ChevronDown, 
  CheckCircle2, 
  XCircle,
  Clock,
  ArrowRight,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StepDetailProps {
  step: XRayStep;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function JsonDisplay({ data, maxHeight = '200px' }: { data: unknown; maxHeight?: string }) {
  return (
    <ScrollArea className={`w-full`} style={{ maxHeight }}>
      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all p-3 bg-background/50 rounded-md">
        {JSON.stringify(data, null, 2)}
      </pre>
    </ScrollArea>
  );
}

function EvaluationCard({ evaluation, showFilters = true }: { evaluation: CandidateEvaluation; showFilters?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const data = evaluation.data as Record<string, unknown>;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className={cn(
          'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all',
          'hover:bg-surface-hover border',
          evaluation.qualified 
            ? 'border-success/20 bg-success/5' 
            : 'border-destructive/20 bg-destructive/5'
        )}>
          {evaluation.qualified ? (
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {data.title as string || evaluation.id}
              </span>
              {evaluation.rank && (
                <Badge variant="secondary" className="text-xs">
                  #{evaluation.rank}
                </Badge>
              )}
            </div>
            {evaluation.score !== undefined && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Score: <span className="font-mono text-foreground">{evaluation.score.toFixed(2)}</span>
              </div>
            )}
          </div>

          <ChevronDown className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 p-3 rounded-lg bg-surface-1 border border-border/50 space-y-3">
          {/* Data display */}
          {data && Object.keys(data).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Data</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(data).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-mono text-foreground">
                      {typeof value === 'number' 
                        ? value.toLocaleString() 
                        : String(value).slice(0, 20)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter results */}
          {showFilters && evaluation.filterResults && Object.keys(evaluation.filterResults).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Filter Results</p>
              <div className="space-y-1.5">
                {Object.entries(evaluation.filterResults).map(([filterName, result]) => (
                  <div key={filterName} className={cn(
                    'flex items-start gap-2 text-xs p-2 rounded',
                    result.passed ? 'bg-success/10' : 'bg-destructive/10'
                  )}>
                    {result.passed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-medium capitalize">{filterName.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <p className="text-muted-foreground">{result.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score breakdown */}
          {evaluation.scoreBreakdown && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Score Breakdown</p>
              <div className="space-y-1">
                {Object.entries(evaluation.scoreBreakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-foreground w-10 text-right">
                      {value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function StepDetail({ step }: StepDetailProps) {
  const [showAllEvaluations, setShowAllEvaluations] = useState(false);
  
  // Separate and prioritize failed candidates
  const failedEvaluations = step.evaluations?.filter(e => !e.qualified) || [];
  const passedEvaluations = step.evaluations?.filter(e => e.qualified) || [];
  
  // Show failed first for debugging emphasis
  const sortedEvaluations = [...failedEvaluations, ...passedEvaluations];
  const evaluationsToShow = showAllEvaluations 
    ? sortedEvaluations 
    : sortedEvaluations.slice(0, 5);
  const hasMoreEvaluations = sortedEvaluations.length > 5;
  
  const isFailed = step.status === 'failed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-panel p-6 space-y-6",
        isFailed && "border-destructive/30 bg-destructive/5"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <StepIcon type={step.type} status={step.status} size="lg" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">{step.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="font-mono uppercase text-xs bg-surface-2 px-2 py-0.5 rounded">
                {step.type}
              </span>
              {step.metrics?.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono">{formatDuration(step.metrics.duration)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <StepStatusBadge status={step.status} />
      </div>

      {/* Error */}
      {step.error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-destructive">Step Failed</p>
            <p className="text-sm text-destructive/80 mt-1">{step.error}</p>
          </div>
        </div>
      )}

      {/* Reasoning */}
      {step.reasoning && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary mb-1">Reasoning</p>
              <p className="text-sm text-foreground/80">{step.reasoning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Summary */}
      {step.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {step.metrics.inputCount !== undefined && (
            <div className="p-3 rounded-lg bg-surface-1 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Input</p>
              <p className="text-2xl font-semibold font-mono text-foreground mt-1">
                {step.metrics.inputCount}
              </p>
            </div>
          )}
          {step.metrics.outputCount !== undefined && (
            <div className="p-3 rounded-lg bg-surface-1 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Output</p>
              <p className="text-2xl font-semibold font-mono text-foreground mt-1">
                {step.metrics.outputCount}
              </p>
            </div>
          )}
          {step.metrics.passedCount !== undefined && (
            <div className="p-3 rounded-lg bg-success/5 border border-success/20">
              <p className="text-xs text-success uppercase tracking-wide">Passed</p>
              <p className="text-2xl font-semibold font-mono text-success mt-1">
                {step.metrics.passedCount}
              </p>
            </div>
          )}
          {step.metrics.failedCount !== undefined && (
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-destructive uppercase tracking-wide">Failed</p>
              <p className="text-2xl font-semibold font-mono text-destructive mt-1">
                {step.metrics.failedCount}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filters Applied */}
      {step.filtersApplied && Object.keys(step.filtersApplied).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters Applied
          </h3>
          <div className="grid gap-2">
            {Object.entries(step.filtersApplied).map(([name, filter]) => (
              <div key={name} className="p-3 rounded-lg bg-surface-1 border border-border/50 flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm capitalize">
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{filter.rule}</p>
                </div>
                <div className="text-sm font-mono text-foreground">
                  {typeof filter.value === 'object' 
                    ? JSON.stringify(filter.value)
                    : String(filter.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input/Output */}
      <div className="grid gap-4 md:grid-cols-2">
        {step.input && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Input
            </h3>
            <JsonDisplay data={step.input} />
          </div>
        )}
        {step.output && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Output
            </h3>
            <JsonDisplay data={step.output} />
          </div>
        )}
      </div>

      {/* Evaluations - emphasize failures */}
      {step.evaluations && step.evaluations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Candidate Evaluations ({step.evaluations.length})
            </h3>
            {failedEvaluations.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-3 w-3" />
                  {failedEvaluations.length} rejected
                </span>
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  {passedEvaluations.length} passed
                </span>
              </div>
            )}
          </div>
          
          {/* Failed evaluations section */}
          {failedEvaluations.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-destructive font-medium mb-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Failed Candidates (showing why they were rejected)
              </p>
              <div className="space-y-2">
                {evaluationsToShow?.filter(e => !e.qualified).map((evaluation) => (
                  <EvaluationCard 
                    key={evaluation.id} 
                    evaluation={evaluation}
                    showFilters={step.type === 'filter'}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Passed evaluations section */}
          {passedEvaluations.length > 0 && (
            <div>
              {failedEvaluations.length > 0 && (
                <p className="text-xs text-success font-medium mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Passed Candidates
                </p>
              )}
              <div className="space-y-2">
                {evaluationsToShow?.filter(e => e.qualified).map((evaluation) => (
                  <EvaluationCard 
                    key={evaluation.id} 
                    evaluation={evaluation}
                    showFilters={step.type === 'filter'}
                  />
                ))}
              </div>
            </div>
          )}
          
          {hasMoreEvaluations && (
            <button
              onClick={() => setShowAllEvaluations(!showAllEvaluations)}
              className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {showAllEvaluations 
                ? 'Show less' 
                : `Show ${sortedEvaluations.length - 5} more evaluations`}
            </button>
          )}
        </div>
      )}

      {/* Metadata */}
      {step.metadata && Object.keys(step.metadata).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Metadata
          </h3>
          <JsonDisplay data={step.metadata} maxHeight="150px" />
        </div>
      )}
    </motion.div>
  );
}
