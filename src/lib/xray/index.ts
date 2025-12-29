/**
 * X-Ray SDK
 * 
 * A lightweight library for debugging non-deterministic, multi-step algorithmic systems.
 * Provides transparency into decision-making processes by capturing:
 * - Inputs and outputs at each step
 * - Candidates evaluated and filter results
 * - Per-candidate pass/fail reasons
 * - Human-readable reasoning behind decisions
 * - Complete execution traces
 * 
 * @example
 * ```typescript
 * import { createXRay, xrayStore } from '@/lib/xray';
 * 
 * // Create an execution
 * const xray = createXRay({ 
 *   executionName: 'Product Matching',
 *   description: 'Finding competitor for Water Bottle 32oz'
 * });
 * 
 * // Capture a step with evaluations
 * xray.step('Apply Filters', 'filter')
 *   .withInput({ candidates: 50 })
 *   .withFilters({
 *     priceRange: { value: { min: 15, max: 60 }, rule: '0.5x-2x of reference' }
 *   })
 *   .withEvaluations(candidateEvaluations)
 *   .withReasoning('Narrowed candidates from 50 to 12 based on price/rating/reviews')
 *   .complete({ passed: 12, failed: 38 });
 * 
 * // Finalize and get the trace
 * const trace = xray.finalize(selectedProduct);
 * 
 * // Query stored executions
 * const recentFailed = xrayStore.findByStatus('failed');
 * ```
 * 
 * ## Design Philosophy
 * 
 * Traditional logging/tracing answers: "What happened?"
 * X-Ray answers: "Why did the system make this decision?"
 * 
 * This is achieved through:
 * 1. **Per-candidate evaluations**: See exactly why each candidate passed/failed
 * 2. **Human-readable reasoning**: Every step explains its logic in plain language
 * 3. **Filters as first-class citizens**: Capture the rules, not just the results
 * 4. **Complete context preservation**: Reconstruct any decision without external lookups
 */

// Core SDK
export { createXRay, createExecution, XRayInstance } from './sdk';

// Storage
export { xrayStore, InMemoryXRayStore, type QueryOptions, type XRayStore } from './store';

// Types
export type {
  XRayConfig,
  XRayExecution,
  XRayStep,
  StepBuilder,
  StepMetrics,
  CandidateEvaluation,
  FilterResult,
  StepStatus,
} from './types';
