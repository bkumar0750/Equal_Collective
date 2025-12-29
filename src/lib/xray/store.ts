/**
 * X-Ray Storage Layer
 * 
 * In-memory storage for X-Ray executions, designed for easy database replacement.
 * 
 * Design Decisions:
 * - Map-based storage for O(1) lookups by executionId
 * - Query methods designed to match typical database operations
 * - Stateless interface - easy to swap for Supabase, PostgreSQL, etc.
 * 
 * @example
 * ```typescript
 * import { xrayStore } from '@/lib/xray';
 * 
 * // Save an execution
 * xrayStore.save(execution);
 * 
 * // Query executions
 * const recent = xrayStore.findAll({ limit: 10 });
 * const failed = xrayStore.findByStatus('failed');
 * ```
 */

import type { XRayExecution, StepStatus } from './types';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  status?: StepStatus;
  tags?: string[];
  fromTime?: number;
  toTime?: number;
  orderBy?: 'startTime' | 'endTime' | 'name';
  orderDirection?: 'asc' | 'desc';
}

export interface XRayStore {
  // Core CRUD operations
  save(execution: XRayExecution): void;
  get(id: string): XRayExecution | undefined;
  delete(id: string): boolean;
  clear(): void;

  // Query operations
  findAll(options?: QueryOptions): XRayExecution[];
  findByStatus(status: StepStatus): XRayExecution[];
  findByTags(tags: string[]): XRayExecution[];
  findByTimeRange(from: number, to: number): XRayExecution[];

  // Aggregations
  count(): number;
  countByStatus(): Record<StepStatus, number>;

  // Subscription (for real-time updates)
  subscribe(callback: (execution: XRayExecution) => void): () => void;
}

class InMemoryXRayStore implements XRayStore {
  private executions: Map<string, XRayExecution> = new Map();
  private subscribers: Set<(execution: XRayExecution) => void> = new Set();

  save(execution: XRayExecution): void {
    this.executions.set(execution.id, execution);
    // Notify subscribers
    this.subscribers.forEach(callback => callback(execution));
  }

  get(id: string): XRayExecution | undefined {
    return this.executions.get(id);
  }

  delete(id: string): boolean {
    return this.executions.delete(id);
  }

  clear(): void {
    this.executions.clear();
  }

  findAll(options: QueryOptions = {}): XRayExecution[] {
    let results = Array.from(this.executions.values());

    // Apply filters
    if (options.status) {
      results = results.filter(e => e.status === options.status);
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(e => 
        options.tags!.some(tag => e.tags?.includes(tag))
      );
    }

    if (options.fromTime !== undefined) {
      results = results.filter(e => e.startTime >= options.fromTime!);
    }

    if (options.toTime !== undefined) {
      results = results.filter(e => e.startTime <= options.toTime!);
    }

    // Sort
    const orderBy = options.orderBy || 'startTime';
    const direction = options.orderDirection || 'desc';
    results.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (orderBy) {
        case 'startTime':
          aVal = a.startTime;
          bVal = b.startTime;
          break;
        case 'endTime':
          aVal = a.endTime || 0;
          bVal = b.endTime || 0;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        default:
          aVal = a.startTime;
          bVal = b.startTime;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return direction === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    // Pagination
    const offset = options.offset || 0;
    const limit = options.limit || results.length;
    results = results.slice(offset, offset + limit);

    return results;
  }

  findByStatus(status: StepStatus): XRayExecution[] {
    return this.findAll({ status });
  }

  findByTags(tags: string[]): XRayExecution[] {
    return this.findAll({ tags });
  }

  findByTimeRange(from: number, to: number): XRayExecution[] {
    return this.findAll({ fromTime: from, toTime: to });
  }

  count(): number {
    return this.executions.size;
  }

  countByStatus(): Record<StepStatus, number> {
    const counts: Record<StepStatus, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };

    this.executions.forEach(execution => {
      counts[execution.status]++;
    });

    return counts;
  }

  subscribe(callback: (execution: XRayExecution) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Helper for debugging
  getAll(): XRayExecution[] {
    return Array.from(this.executions.values());
  }
}

// Singleton instance
export const xrayStore = new InMemoryXRayStore();

// Export class for custom instances
export { InMemoryXRayStore };
