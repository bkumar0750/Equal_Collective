import { useState, useCallback, useRef } from 'react';
import type { XRayExecution, XRayStep, CandidateEvaluation } from '@/lib/xray';
import { referenceProduct, candidateProducts, type Product } from '@/data/mockExecution';

// Simulate step execution with delays
const STEP_CONFIGS = [
  {
    name: 'Keyword Generation',
    type: 'llm' as const,
    duration: 800,
    buildStep: (): Partial<XRayStep> => ({
      input: {
        productTitle: referenceProduct.title,
        category: referenceProduct.category,
      },
      output: {
        keywords: [
          'stainless steel water bottle insulated',
          'vacuum insulated bottle 32oz',
          'insulated sports water bottle',
        ],
        model: 'gpt-4',
        tokensUsed: 127,
      },
      reasoning: 'Extracted key product attributes: material (stainless steel), capacity (32oz), feature (insulated). Generated variations targeting competitor products in same category.',
      metrics: { outputCount: 3 },
      metadata: { temperature: 0.3, maxTokens: 150 },
    }),
  },
  {
    name: 'Candidate Search',
    type: 'search' as const,
    duration: 1200,
    buildStep: (): Partial<XRayStep> => ({
      input: {
        keywords: ['stainless steel water bottle insulated'],
        limit: 50,
        marketplace: 'Amazon US',
      },
      output: {
        totalResults: 2847,
        candidatesFetched: candidateProducts.length,
        candidates: candidateProducts,
      },
      reasoning: 'Fetched top results by relevance from Amazon Product API. 2,847 total matches found in catalog; retrieved first 50 for evaluation.',
      metrics: { inputCount: 1, outputCount: candidateProducts.length },
    }),
  },
  {
    name: 'Apply Filters',
    type: 'filter' as const,
    duration: 1000,
    buildStep: (): Partial<XRayStep> => {
      const priceMin = referenceProduct.price * 0.5;
      const priceMax = referenceProduct.price * 2;
      
      const evaluations: CandidateEvaluation<Product>[] = candidateProducts.map((product) => {
        const pricePass = product.price >= priceMin && product.price <= priceMax;
        const ratingPass = product.rating >= 3.8;
        const reviewsPass = product.reviews >= 100;
        
        return {
          id: product.asin,
          data: product,
          filterResults: {
            priceRange: {
              passed: pricePass,
              detail: pricePass 
                ? `$${product.price.toFixed(2)} is within $${priceMin.toFixed(2)}-$${priceMax.toFixed(2)}`
                : `$${product.price.toFixed(2)} is ${product.price < priceMin ? 'below minimum' : 'above maximum'} $${product.price < priceMin ? priceMin.toFixed(2) : priceMax.toFixed(2)}`,
            },
            minRating: {
              passed: ratingPass,
              detail: ratingPass ? `${product.rating} >= 3.8` : `${product.rating} < 3.8 threshold`,
            },
            minReviews: {
              passed: reviewsPass,
              detail: reviewsPass ? `${product.reviews.toLocaleString()} >= 100` : `${product.reviews} < 100 minimum`,
            },
          },
          qualified: pricePass && ratingPass && reviewsPass,
        };
      });

      return {
        input: {
          candidatesCount: candidateProducts.length,
          referenceProduct: {
            asin: referenceProduct.asin,
            title: referenceProduct.title,
            price: referenceProduct.price,
            rating: referenceProduct.rating,
            reviews: referenceProduct.reviews,
          },
        },
        filtersApplied: {
          priceRange: { value: { min: priceMin, max: priceMax }, rule: `0.5x - 2x of reference price ($${referenceProduct.price})` },
          minRating: { value: 3.8, rule: 'Must be at least 3.8 stars' },
          minReviews: { value: 100, rule: 'Must have at least 100 reviews' },
        },
        evaluations,
        output: { totalEvaluated: candidateProducts.length, passed: 8, failed: 4 },
        reasoning: 'Applied price, rating, and review count filters to narrow candidates from 12 to 8. Eliminated 4 products.',
        metrics: { inputCount: candidateProducts.length, outputCount: 8, passedCount: 8, failedCount: 4 },
      };
    },
  },
  {
    name: 'LLM Relevance Evaluation',
    type: 'llm' as const,
    duration: 1500,
    buildStep: (): Partial<XRayStep> => ({
      input: {
        candidatesCount: 8,
        referenceProduct: {
          asin: referenceProduct.asin,
          title: referenceProduct.title,
          category: referenceProduct.category,
        },
        model: 'gpt-4',
      },
      metadata: {
        promptTemplate: "Given the reference product '{title}', determine if each candidate is a true competitor or a false positive.",
      },
      evaluations: [
        { id: 'B0COMP01', data: { title: 'HydroFlask 32oz Wide Mouth', isCompetitor: true, confidence: 0.95 }, filterResults: {}, qualified: true },
        { id: 'B0COMP02', data: { title: 'Yeti Rambler 26oz', isCompetitor: true, confidence: 0.92 }, filterResults: {}, qualified: true },
        { id: 'B0COMP04', data: { title: 'Bottle Cleaning Brush Set', isCompetitor: false, confidence: 0.98, reason: 'Accessory' }, filterResults: {}, qualified: false },
        { id: 'B0COMP05', data: { title: 'Replacement Lid for HydroFlask', isCompetitor: false, confidence: 0.97, reason: 'Replacement part' }, filterResults: {}, qualified: false },
        { id: 'B0COMP07', data: { title: 'Stanley Adventure Quencher', isCompetitor: true, confidence: 0.91 }, filterResults: {}, qualified: true },
      ],
      output: { totalEvaluated: 8, confirmedCompetitors: 5, falsePositivesRemoved: 3 },
      reasoning: 'LLM identified and removed 3 false positives (accessories and replacement parts).',
      metrics: { inputCount: 8, outputCount: 5, passedCount: 5, failedCount: 3 },
    }),
  },
  {
    name: 'Rank & Select',
    type: 'rank' as const,
    duration: 1300,
    buildStep: (): Partial<XRayStep> => ({
      input: {
        candidatesCount: 5,
        referenceProduct: {
          asin: referenceProduct.asin,
          title: referenceProduct.title,
          price: referenceProduct.price,
        },
      },
      metadata: {
        rankingCriteria: { primary: 'review_count', secondary: 'rating', tertiary: 'price_proximity' },
      },
      evaluations: [
        { id: 'B0COMP01', data: candidateProducts[0], filterResults: {}, qualified: true, score: 0.92, scoreBreakdown: { reviewCountScore: 1.0, ratingScore: 0.9, priceProximityScore: 0.7 }, rank: 1 },
        { id: 'B0COMP02', data: candidateProducts[1], filterResults: {}, qualified: true, score: 0.74, scoreBreakdown: { reviewCountScore: 0.63, ratingScore: 0.85, priceProximityScore: 0.85 }, rank: 2 },
        { id: 'B0COMP07', data: candidateProducts[6], filterResults: {}, qualified: true, score: 0.65, scoreBreakdown: { reviewCountScore: 0.46, ratingScore: 0.8, priceProximityScore: 0.84 }, rank: 3 },
      ],
      output: {
        selectedCompetitor: { asin: 'B0COMP01', title: 'HydroFlask 32oz Wide Mouth', price: 44.99, rating: 4.5, reviews: 8932 },
        reason: 'Highest overall score (0.92) - top review count with strong rating',
      },
      reasoning: 'Ranked 5 qualified candidates using weighted scoring. HydroFlask selected as best match.',
      metrics: { inputCount: 5, outputCount: 1 },
    }),
  },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useXRayDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [liveExecution, setLiveExecution] = useState<XRayExecution | null>(null);
  const abortRef = useRef(false);

  const runDemo = useCallback(async () => {
    abortRef.current = false;
    setIsRunning(true);

    const executionId = generateId();
    const startTime = Date.now();

    // Initialize execution
    const execution: XRayExecution = {
      id: executionId,
      name: 'Competitor Product Selection',
      description: `Finding the best competitor product for ${referenceProduct.title}`,
      startTime,
      status: 'running',
      steps: [],
      context: {
        referenceProduct,
        marketplace: 'Amazon US',
        userId: 'seller-12345',
      },
      tags: ['competitor-analysis', 'product-matching', 'live-demo'],
    };

    setLiveExecution(execution);

    // Run each step with delay
    for (let i = 0; i < STEP_CONFIGS.length; i++) {
      if (abortRef.current) break;

      const config = STEP_CONFIGS[i];
      const stepId = `step-${i + 1}`;
      const stepStartTime = Date.now();

      // Add step as "running"
      const runningStep: XRayStep = {
        id: stepId,
        name: config.name,
        type: config.type,
        status: 'running',
        startTime: stepStartTime,
        input: undefined,
      };

      setLiveExecution(prev => prev ? {
        ...prev,
        steps: [...prev.steps, runningStep],
      } : null);

      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, config.duration));

      if (abortRef.current) break;

      // Complete the step
      const stepData = config.buildStep();
      const completedStep: XRayStep = {
        ...runningStep,
        ...stepData,
        status: 'completed',
        endTime: Date.now(),
        metrics: {
          ...stepData.metrics,
          duration: Date.now() - stepStartTime,
        },
      };

      setLiveExecution(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? completedStep : s),
      } : null);

      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Finalize execution
    if (!abortRef.current) {
      setLiveExecution(prev => prev ? {
        ...prev,
        status: 'completed',
        endTime: Date.now(),
        finalOutput: {
          selectedCompetitor: {
            asin: 'B0COMP01',
            title: 'HydroFlask 32oz Wide Mouth',
            price: 44.99,
            rating: 4.5,
            reviews: 8932,
          },
          pipelineMetrics: {
            totalDuration: Date.now() - startTime,
            stepsCompleted: 5,
            candidatesEvaluated: 12,
            finalSelection: 1,
          },
        },
      } : null);
    }

    setIsRunning(false);
  }, []);

  const stopDemo = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
  }, []);

  const resetDemo = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
    setLiveExecution(null);
  }, []);

  return {
    isRunning,
    liveExecution,
    runDemo,
    stopDemo,
    resetDemo,
  };
}
