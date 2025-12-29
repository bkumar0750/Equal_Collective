import { 
  Sparkles, 
  Search, 
  Filter, 
  TrendingUp, 
  RefreshCw, 
  Cog,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle
} from 'lucide-react';
import type { XRayStep, StepStatus } from '@/lib/xray';
import { cn } from '@/lib/utils';

interface StepIconProps {
  type: XRayStep['type'];
  status: StepStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const typeIcons = {
  llm: Sparkles,
  search: Search,
  filter: Filter,
  rank: TrendingUp,
  transform: RefreshCw,
  custom: Cog,
};

const statusIcons = {
  pending: Circle,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StepIcon({ type, status, size = 'md', className }: StepIconProps) {
  const TypeIcon = typeIcons[type];
  const sizeClass = sizeClasses[size];
  
  return (
    <div className={cn(
      'relative flex items-center justify-center rounded-lg p-2',
      status === 'completed' && 'bg-success/10 text-success',
      status === 'failed' && 'bg-destructive/10 text-destructive',
      status === 'running' && 'bg-primary/10 text-primary',
      status === 'pending' && 'bg-muted text-muted-foreground',
      className
    )}>
      <TypeIcon className={cn(sizeClass, status === 'running' && 'animate-pulse')} />
    </div>
  );
}

export function StepStatusBadge({ status }: { status: StepStatus }) {
  const StatusIcon = statusIcons[status];
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
      status === 'completed' && 'bg-success/10 text-success border border-success/20',
      status === 'failed' && 'bg-destructive/10 text-destructive border border-destructive/20',
      status === 'running' && 'bg-primary/10 text-primary border border-primary/20',
      status === 'pending' && 'bg-muted text-muted-foreground border border-border',
    )}>
      <StatusIcon className={cn(
        'h-3 w-3',
        status === 'running' && 'animate-spin'
      )} />
      <span className="capitalize">{status}</span>
    </div>
  );
}
