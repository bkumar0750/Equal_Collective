import { motion } from 'framer-motion';
import { Trophy, Package, TrendingUp, Clock, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinalOutputProps {
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
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function FinalOutput({ output }: FinalOutputProps) {
  const { selectedCompetitor, pipelineMetrics } = output;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Final Selection</h2>
      </div>

      {selectedCompetitor && (
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-surface-1">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-foreground">{selectedCompetitor.title}</h3>
              <p className="text-xs text-muted-foreground font-mono">{selectedCompetitor.asin}</p>
              
              <div className="flex flex-wrap gap-4 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-lg font-semibold font-mono text-foreground">
                    ${selectedCompetitor.price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-lg font-semibold font-mono text-foreground">
                    {selectedCompetitor.rating}★
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                  <p className="text-lg font-semibold font-mono text-foreground">
                    {selectedCompetitor.reviews.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {pipelineMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-surface-1 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Duration</span>
            </div>
            <p className="text-xl font-semibold font-mono text-foreground">
              {formatDuration(pipelineMetrics.totalDuration)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-surface-1 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Steps</span>
            </div>
            <p className="text-xl font-semibold font-mono text-foreground">
              {pipelineMetrics.stepsCompleted}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-surface-1 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Evaluated</span>
            </div>
            <p className="text-xl font-semibold font-mono text-foreground">
              {pipelineMetrics.candidatesEvaluated}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-primary">Selected</span>
            </div>
            <p className="text-xl font-semibold font-mono text-primary">
              {pipelineMetrics.finalSelection}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
