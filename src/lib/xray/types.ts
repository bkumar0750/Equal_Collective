/**
 * X-Ray SDK Type Definitions
 * 
 * Core types for capturing decision context in multi-step algorithmic systems.
 * 
 * Design Philosophy:
 * - Decisions are first-class: every step captures WHY, not just WHAT
 * - Per-candidate evaluations: understand why each candidate passed/failed
 * - Human-readable reasoning: debugging should be intuitive
 * - Domain-agnostic: works for any multi-step decision pipeline
 */

/**
 * Status of a step or execution
 */
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Result of applying a single filter to a candidate
 * 
 * @example
 * {
 *   passed: false,
 *   detail: "$8.99 is below minimum $12.50"
 * }
 */
export interface FilterResult {
  passed: boolean;
  /** Human-readable explanation of why this filter passed/failed */
  detail: string;
}

/**
 * Evaluation of a single candidate in a filtering/ranking step
 * 
 * This is the core of "decision observability" - it explains WHY
 * each candidate was included or excluded, not just the final result.
 * 
 * @example
 * {
 *   id: "B0COMP01",
 *   data: { title: "HydroFlask 32oz", price: 44.99, rating: 4.5 },
 *   filterResults: {
 *     priceRange: { passed: true, detail: "$44.99 is within $15-$60" },
 *     minRating: { passed: true, detail: "4.5 >= 3.8" }
 *   },
 *   qualified: true,
 *   score: 0.92,
 *   rank: 1
 * }
 */
export interface CandidateEvaluation<T = unknown> {
  /** Unique identifier for this candidate */
  id: string;
  /** The actual candidate data */
  data: T;
  /** Results of each filter applied (key = filter name) */
  filterResults: Record<string, FilterResult>;
  /** Whether this candidate passed all filters / qualified for selection */
  qualified: boolean;
  /** Computed score for ranking (optional) */
  score?: number;
  /** Breakdown of how the score was calculated (optional) */
  scoreBreakdown?: Record<string, number>;
  /** Final rank among qualified candidates (optional) */
  rank?: number;
}

/**
 * Metrics captured for a step
 */
export interface StepMetrics {
  /** Number of items received as input */
  inputCount?: number;
  /** Number of items produced as output */
  outputCount?: number;
  /** Number of candidates that passed filters */
  passedCount?: number;
  /** Number of candidates that failed filters */
  failedCount?: number;
  /** Step duration in milliseconds */
  duration?: number;
}

/**
 * A single step in the execution pipeline
 * 
 * Steps are the building blocks of decision observability. Each step
 * captures not just inputs/outputs, but the reasoning and evaluations
 * that led to the output.
 * 
 * Step Types:
 * - 'llm': LLM-based generation or evaluation (non-deterministic)
 * - 'search': API search or data retrieval
 * - 'filter': Rule-based filtering of candidates
 * - 'rank': Scoring and ranking of candidates
 * - 'transform': Data transformation or enrichment
 * - 'custom': Any other step type
 */
export interface XRayStep<TInput = unknown, TOutput = unknown> {
  /** Unique step identifier */
  id: string;
  /** Human-readable step name */
  name: string;
  /** Step type for categorization and visualization */
  type: 'llm' | 'search' | 'filter' | 'rank' | 'transform' | 'custom';
  /** Current step status */
  status: StepStatus;
  /** When this step started (Unix timestamp) */
  startTime: number;
  /** When this step ended (Unix timestamp) */
  endTime?: number;
  /** Input data for this step */
  input: TInput;
  /** Output data from this step */
  output?: TOutput;
  /** 
   * Human-readable explanation of what happened in this step
   * This is the most important field for debugging!
   */
  reasoning?: string;
  /** Step performance metrics */
  metrics?: StepMetrics;
  /** Per-candidate evaluations (for filter/rank steps) */
  evaluations?: CandidateEvaluation[];
  /** Filters/rules applied in this step with their configurations */
  filtersApplied?: Record<string, { value: unknown; rule: string }>;
  /** Additional metadata for this step */
  metadata?: Record<string, unknown>;
  /** Error message if step failed */
  error?: string;
}

/**
 * A complete execution trace
 * 
 * An execution represents a single run of a multi-step pipeline,
 * capturing all steps, context, and the final output.
 */
export interface XRayExecution {
  /** Unique execution identifier */
  id: string;
  /** Human-readable execution name */
  name: string;
  /** Optional description of what this execution does */
  description?: string;
  /** When this execution started (Unix timestamp) */
  startTime: number;
  /** When this execution ended (Unix timestamp) */
  endTime?: number;
  /** Current execution status */
  status: StepStatus;
  /** Ordered list of steps in this execution */
  steps: XRayStep[];
  /** Global context available to all steps */
  context?: Record<string, unknown>;
  /** Final output of the pipeline */
  finalOutput?: unknown;
  /** Tags for categorization and querying */
  tags?: string[];
}

/**
 * Configuration for creating an X-Ray instance
 */
export interface XRayConfig {
  /** Name for this execution */
  executionName?: string;
  /** Description of what this execution does */
  description?: string;
  /** Global context available to all steps */
  context?: Record<string, unknown>;
  /** Tags for categorization and querying */
  tags?: string[];
  /** Auto-save to store after each step (default: true) */
  autoSave?: boolean;
  /** Callback when a step starts */
  onStepStart?: (step: XRayStep) => void;
  /** Callback when a step completes */
  onStepComplete?: (step: XRayStep) => void;
  /** Callback when the execution completes */
  onExecutionComplete?: (execution: XRayExecution) => void;
}

/**
 * Builder pattern for creating steps fluently
 */
export interface StepBuilder<TInput = unknown, TOutput = unknown> {
  /** Set the input data for this step */
  withInput: (input: TInput) => StepBuilder<TInput, TOutput>;
  /** Set the filters applied in this step */
  withFilters: (filters: Record<string, { value: unknown; rule: string }>) => StepBuilder<TInput, TOutput>;
  /** Set the per-candidate evaluations */
  withEvaluations: (evaluations: CandidateEvaluation[]) => StepBuilder<TInput, TOutput>;
  /** Set the human-readable reasoning for this step */
  withReasoning: (reasoning: string) => StepBuilder<TInput, TOutput>;
  /** Set additional metadata */
  withMetadata: (metadata: Record<string, unknown>) => StepBuilder<TInput, TOutput>;
  /** Complete the step with output and optional metrics */
  complete: (output: TOutput, metrics?: StepMetrics) => XRayStep<TInput, TOutput>;
  /** Mark the step as failed with an error message */
  fail: (error: string) => XRayStep<TInput, TOutput>;
}
