/**
 * X-Ray SDK
 * 
 * A lightweight library for capturing decision context in multi-step algorithmic systems.
 * Provides visibility into why decisions were made, not just what happened.
 * 
 * Design Philosophy:
 * - Decisions are first-class observability units, not just logs
 * - Per-candidate evaluations explain the "why" behind filtering/ranking
 * - Human-readable reasoning at every step
 * 
 * Usage:
 * ```typescript
 * // Create an execution context
 * const xray = createXRay({ executionName: 'Competitor Selection' });
 * 
 * // Capture a step with the builder pattern
 * const step = xray.step('keyword_generation', 'llm')
 *   .withInput({ productTitle: 'Water Bottle 32oz' })
 *   .withReasoning('Extracted key product attributes')
 *   .complete({ keywords: ['water bottle insulated'] });
 * 
 * // Finalize and get the complete trace
 * const execution = xray.finalize();
 * ```
 */

import type {
  XRayConfig,
  XRayExecution,
  XRayStep,
  StepBuilder,
  StepMetrics,
  CandidateEvaluation,
  StepStatus,
} from './types';
import { xrayStore } from './store';

// Simple UUID alternative for browser compatibility
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new X-Ray instance for tracing an execution
 */
export function createXRay(config: XRayConfig = {}): XRayInstance {
  return new XRayInstance(config);
}

/**
 * Alternative API matching the spec's createExecution pattern
 */
export function createExecution(
  name: string, 
  options: Omit<XRayConfig, 'executionName'> = {}
): XRayInstance {
  return new XRayInstance({ ...options, executionName: name });
}

export class XRayInstance {
  private execution: XRayExecution;
  private config: XRayConfig;
  private autoSave: boolean;

  constructor(config: XRayConfig = {}) {
    this.config = config;
    this.autoSave = config.autoSave !== false; // Default to true
    
    this.execution = {
      id: generateId(),
      name: config.executionName || 'Unnamed Execution',
      description: config.description,
      startTime: Date.now(),
      status: 'running',
      steps: [],
      context: config.context,
      tags: config.tags,
    };

    // Save initial state to store
    if (this.autoSave) {
      xrayStore.save(this.execution);
    }
  }

  /**
   * Start a new step in the execution pipeline
   * 
   * @param name - Human-readable step name (e.g., "Apply Price Filter")
   * @param type - Step type for categorization: 'llm' | 'search' | 'filter' | 'rank' | 'transform' | 'custom'
   * 
   * @example
   * ```typescript
   * xray.step('Apply Filters', 'filter')
   *   .withInput({ candidates: products })
   *   .withFilters({
   *     priceRange: { value: { min: 10, max: 50 }, rule: '0.5x-2x of reference' }
   *   })
   *   .withEvaluations(evaluatedCandidates)
   *   .withReasoning('Narrowed from 50 to 12 candidates')
   *   .complete({ passed: 12, failed: 38 });
   * ```
   */
  step<TInput = unknown, TOutput = unknown>(
    name: string,
    type: XRayStep['type'] = 'custom'
  ): StepBuilder<TInput, TOutput> {
    const stepId = generateId();
    const startTime = Date.now();

    let stepData: Partial<XRayStep<TInput, TOutput>> = {
      id: stepId,
      name,
      type,
      status: 'running' as StepStatus,
      startTime,
    };

    // Notify step start
    this.config.onStepStart?.(stepData as XRayStep);

    const builder: StepBuilder<TInput, TOutput> = {
      withInput: (input: TInput) => {
        stepData.input = input;
        return builder;
      },

      withFilters: (filters) => {
        stepData.filtersApplied = filters;
        return builder;
      },

      withEvaluations: (evaluations: CandidateEvaluation[]) => {
        stepData.evaluations = evaluations;
        return builder;
      },

      withReasoning: (reasoning: string) => {
        stepData.reasoning = reasoning;
        return builder;
      },

      withMetadata: (metadata: Record<string, unknown>) => {
        stepData.metadata = metadata;
        return builder;
      },

      complete: (output: TOutput, metrics?: StepMetrics) => {
        const completedStep: XRayStep<TInput, TOutput> = {
          ...stepData as XRayStep<TInput, TOutput>,
          output,
          status: 'completed',
          endTime: Date.now(),
          metrics: {
            ...metrics,
            duration: Date.now() - startTime,
          },
        };

        this.execution.steps.push(completedStep as XRayStep);
        this.config.onStepComplete?.(completedStep as XRayStep);

        // Auto-save after each step
        if (this.autoSave) {
          xrayStore.save(this.execution);
        }

        return completedStep;
      },

      fail: (error: string) => {
        const failedStep: XRayStep<TInput, TOutput> = {
          ...stepData as XRayStep<TInput, TOutput>,
          status: 'failed',
          endTime: Date.now(),
          error,
          metrics: {
            duration: Date.now() - startTime,
          },
        };

        this.execution.steps.push(failedStep as XRayStep);
        this.config.onStepComplete?.(failedStep as XRayStep);

        // Auto-save after failure
        if (this.autoSave) {
          xrayStore.save(this.execution);
        }

        return failedStep;
      },
    };

    return builder;
  }

  /**
   * Add context to the execution (can be called at any time)
   */
  addContext(key: string, value: unknown): this {
    if (!this.execution.context) {
      this.execution.context = {};
    }
    this.execution.context[key] = value;
    return this;
  }

  /**
   * Finalize the execution and return the complete trace
   * 
   * @param finalOutput - The final result of the pipeline (optional)
   */
  finalize(finalOutput?: unknown): XRayExecution {
    const hasFailedStep = this.execution.steps.some(s => s.status === 'failed');
    
    this.execution.endTime = Date.now();
    this.execution.status = hasFailedStep ? 'failed' : 'completed';
    this.execution.finalOutput = finalOutput;

    this.config.onExecutionComplete?.(this.execution);

    // Save final state
    if (this.autoSave) {
      xrayStore.save(this.execution);
    }

    return this.execution;
  }

  /**
   * Alias for finalize() - matches the spec's finish() naming
   */
  finish(finalOutput?: unknown): XRayExecution {
    return this.finalize(finalOutput);
  }

  /**
   * Get current execution state (for debugging/monitoring)
   */
  getExecution(): XRayExecution {
    return { ...this.execution };
  }

  /**
   * Get all steps
   */
  getSteps(): XRayStep[] {
    return [...this.execution.steps];
  }

  /**
   * Get the execution ID
   */
  getId(): string {
    return this.execution.id;
  }
}

// Export types
export type { XRayConfig, XRayExecution, XRayStep, StepBuilder, CandidateEvaluation, FilterResult } from './types';
