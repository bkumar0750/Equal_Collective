/**
 * Mock X-Ray Execution Data
 * 
 * Simulates a competitor product selection pipeline with 5 steps:
 * 1. Keyword Generation (LLM)
 * 2. Candidate Search (API)
 * 3. Apply Filters
 * 4. LLM Relevance Evaluation
 * 5. Rank & Select
 */

import type { XRayExecution, CandidateEvaluation } from '@/lib/xray';

export interface Product {
  asin: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  category?: string;
  imageUrl?: string;
}

export const referenceProduct: Product = {
  asin: 'B0XYZ123',
  title: 'ProBrand Steel Bottle 32oz Insulated',
  price: 29.99,
  rating: 4.2,
  reviews: 1247,
  category: 'Sports & Outdoors > Water Bottles',
};

export const candidateProducts: Product[] = [
  { asin: 'B0COMP01', title: 'HydroFlask 32oz Wide Mouth', price: 44.99, rating: 4.5, reviews: 8932 },
  { asin: 'B0COMP02', title: 'Yeti Rambler 26oz', price: 34.99, rating: 4.4, reviews: 5621 },
  { asin: 'B0COMP03', title: 'Generic Water Bottle', price: 8.99, rating: 3.2, reviews: 45 },
  { asin: 'B0COMP04', title: 'Bottle Cleaning Brush Set', price: 12.99, rating: 4.6, reviews: 3421 },
  { asin: 'B0COMP05', title: 'Replacement Lid for HydroFlask', price: 9.99, rating: 4.1, reviews: 892 },
  { asin: 'B0COMP06', title: 'Water Bottle Carrier Bag with Strap', price: 15.99, rating: 4.3, reviews: 1567 },
  { asin: 'B0COMP07', title: 'Stanley Adventure Quencher', price: 35.00, rating: 4.3, reviews: 4102 },
  { asin: 'B0COMP08', title: 'Contigo Autoseal 24oz', price: 22.99, rating: 4.1, reviews: 2891 },
  { asin: 'B0COMP09', title: 'Premium Titanium Bottle 40oz', price: 89.00, rating: 4.8, reviews: 234 },
  { asin: 'B0COMP10', title: 'CamelBak Chute Mag 32oz', price: 28.99, rating: 4.4, reviews: 3567 },
  { asin: 'B0COMP11', title: 'Nalgene Wide Mouth 32oz', price: 14.99, rating: 4.2, reviews: 6789 },
  { asin: 'B0COMP12', title: 'Thermos Stainless King 24oz', price: 26.99, rating: 4.3, reviews: 4123 },
];

export const mockExecution: XRayExecution = {
  id: 'exec-2024-001',
  name: 'Competitor Product Selection',
  description: 'Finding the best competitor product for ProBrand Steel Bottle 32oz Insulated',
  startTime: Date.now() - 4500,
  endTime: Date.now(),
  status: 'completed',
  context: {
    referenceProduct,
    marketplace: 'Amazon US',
    userId: 'seller-12345',
  },
  tags: ['competitor-analysis', 'product-matching', 'automated'],
  steps: [
    {
      id: 'step-1',
      name: 'Keyword Generation',
      type: 'llm',
      status: 'completed',
      startTime: Date.now() - 4500,
      endTime: Date.now() - 4200,
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
      metrics: {
        duration: 300,
        outputCount: 3,
      },
      metadata: {
        temperature: 0.3,
        maxTokens: 150,
      },
    },
    {
      id: 'step-2',
      name: 'Candidate Search',
      type: 'search',
      status: 'completed',
      startTime: Date.now() - 4200,
      endTime: Date.now() - 3500,
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
      metrics: {
        duration: 700,
        inputCount: 1,
        outputCount: candidateProducts.length,
      },
    },
    {
      id: 'step-3',
      name: 'Apply Filters',
      type: 'filter',
      status: 'completed',
      startTime: Date.now() - 3500,
      endTime: Date.now() - 2800,
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
        priceRange: { value: { min: 14.99, max: 59.98 }, rule: '0.5x - 2x of reference price ($29.99)' },
        minRating: { value: 3.8, rule: 'Must be at least 3.8 stars' },
        minReviews: { value: 100, rule: 'Must have at least 100 reviews' },
      },
      evaluations: candidateProducts.map((product): CandidateEvaluation<Product> => {
        const priceMin = referenceProduct.price * 0.5;
        const priceMax = referenceProduct.price * 2;
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
              detail: ratingPass 
                ? `${product.rating} >= 3.8`
                : `${product.rating} < 3.8 threshold`,
            },
            minReviews: {
              passed: reviewsPass,
              detail: reviewsPass 
                ? `${product.reviews.toLocaleString()} >= 100`
                : `${product.reviews} < 100 minimum`,
            },
          },
          qualified: pricePass && ratingPass && reviewsPass,
        };
      }),
      output: {
        totalEvaluated: candidateProducts.length,
        passed: 8,
        failed: 4,
      },
      reasoning: 'Applied price, rating, and review count filters to narrow candidates from 12 to 8. Eliminated 4 products: 2 failed price range, 1 failed rating, 1 failed multiple criteria.',
      metrics: {
        duration: 700,
        inputCount: candidateProducts.length,
        outputCount: 8,
        passedCount: 8,
        failedCount: 4,
      },
    },
    {
      id: 'step-4',
      name: 'LLM Relevance Evaluation',
      type: 'llm',
      status: 'completed',
      startTime: Date.now() - 2800,
      endTime: Date.now() - 1500,
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
        promptTemplate: "Given the reference product '{title}', determine if each candidate is a true competitor (same product type) or a false positive (accessory, replacement part, bundle, etc.)",
      },
      evaluations: [
        { id: 'B0COMP01', data: { title: 'HydroFlask 32oz Wide Mouth', isCompetitor: true, confidence: 0.95 }, filterResults: {}, qualified: true },
        { id: 'B0COMP02', data: { title: 'Yeti Rambler 26oz', isCompetitor: true, confidence: 0.92 }, filterResults: {}, qualified: true },
        { id: 'B0COMP04', data: { title: 'Bottle Cleaning Brush Set', isCompetitor: false, confidence: 0.98, reason: 'Accessory, not a water bottle' }, filterResults: {}, qualified: false },
        { id: 'B0COMP05', data: { title: 'Replacement Lid for HydroFlask', isCompetitor: false, confidence: 0.97, reason: 'Replacement part, not a complete product' }, filterResults: {}, qualified: false },
        { id: 'B0COMP06', data: { title: 'Water Bottle Carrier Bag', isCompetitor: false, confidence: 0.96, reason: 'Accessory, not a water bottle' }, filterResults: {}, qualified: false },
        { id: 'B0COMP07', data: { title: 'Stanley Adventure Quencher', isCompetitor: true, confidence: 0.91 }, filterResults: {}, qualified: true },
        { id: 'B0COMP10', data: { title: 'CamelBak Chute Mag 32oz', isCompetitor: true, confidence: 0.93 }, filterResults: {}, qualified: true },
        { id: 'B0COMP12', data: { title: 'Thermos Stainless King 24oz', isCompetitor: true, confidence: 0.89 }, filterResults: {}, qualified: true },
      ],
      output: {
        totalEvaluated: 8,
        confirmedCompetitors: 5,
        falsePositivesRemoved: 3,
      },
      reasoning: 'LLM identified and removed 3 false positives (accessories and replacement parts). Confirmed 5 products as true competitors based on product type matching.',
      metrics: {
        duration: 1300,
        inputCount: 8,
        outputCount: 5,
        passedCount: 5,
        failedCount: 3,
      },
    },
    {
      id: 'step-5',
      name: 'Rank & Select',
      type: 'rank',
      status: 'completed',
      startTime: Date.now() - 1500,
      endTime: Date.now() - 200,
      input: {
        candidatesCount: 5,
        referenceProduct: {
          asin: referenceProduct.asin,
          title: referenceProduct.title,
          price: referenceProduct.price,
          rating: referenceProduct.rating,
          reviews: referenceProduct.reviews,
        },
      },
      metadata: {
        rankingCriteria: {
          primary: 'review_count',
          secondary: 'rating',
          tertiary: 'price_proximity',
        },
      },
      evaluations: [
        {
          id: 'B0COMP01',
          data: candidateProducts[0],
          filterResults: {},
          qualified: true,
          score: 0.92,
          scoreBreakdown: { reviewCountScore: 1.0, ratingScore: 0.9, priceProximityScore: 0.7 },
          rank: 1,
        },
        {
          id: 'B0COMP02',
          data: candidateProducts[1],
          filterResults: {},
          qualified: true,
          score: 0.74,
          scoreBreakdown: { reviewCountScore: 0.63, ratingScore: 0.85, priceProximityScore: 0.85 },
          rank: 2,
        },
        {
          id: 'B0COMP07',
          data: candidateProducts[6],
          filterResults: {},
          qualified: true,
          score: 0.65,
          scoreBreakdown: { reviewCountScore: 0.46, ratingScore: 0.8, priceProximityScore: 0.84 },
          rank: 3,
        },
        {
          id: 'B0COMP10',
          data: candidateProducts[9],
          filterResults: {},
          qualified: true,
          score: 0.58,
          scoreBreakdown: { reviewCountScore: 0.4, ratingScore: 0.85, priceProximityScore: 0.97 },
          rank: 4,
        },
        {
          id: 'B0COMP12',
          data: candidateProducts[11],
          filterResults: {},
          qualified: true,
          score: 0.54,
          scoreBreakdown: { reviewCountScore: 0.46, ratingScore: 0.8, priceProximityScore: 0.9 },
          rank: 5,
        },
      ],
      output: {
        selectedCompetitor: {
          asin: 'B0COMP01',
          title: 'HydroFlask 32oz Wide Mouth',
          price: 44.99,
          rating: 4.5,
          reviews: 8932,
        },
        reason: 'Highest overall score (0.92) - top review count (8,932) with strong rating (4.5★)',
      },
      reasoning: 'Ranked 5 qualified candidates using weighted scoring: review count (primary), rating (secondary), price proximity (tertiary). HydroFlask selected as best competitor match.',
      metrics: {
        duration: 1300,
        inputCount: 5,
        outputCount: 1,
      },
    },
  ],
  finalOutput: {
    selectedCompetitor: {
      asin: 'B0COMP01',
      title: 'HydroFlask 32oz Wide Mouth',
      price: 44.99,
      rating: 4.5,
      reviews: 8932,
    },
    pipelineMetrics: {
      totalDuration: 4300,
      stepsCompleted: 5,
      candidatesEvaluated: 12,
      finalSelection: 1,
    },
  },
};

// Additional mock executions for the list view
export const mockExecutions: XRayExecution[] = [
  mockExecution,
  {
    ...mockExecution,
    id: 'exec-2024-002',
    name: 'Competitor Selection - Electronics',
    description: 'Finding competitor for Wireless Earbuds Pro',
    startTime: Date.now() - 3600000,
    endTime: Date.now() - 3595500,
    status: 'completed',
    context: {
      referenceProduct: { title: 'Wireless Earbuds Pro', price: 79.99 },
    },
  },
  {
    ...mockExecution,
    id: 'exec-2024-003',
    name: 'Competitor Selection - Kitchen',
    description: 'Finding competitor for Coffee Maker Deluxe',
    startTime: Date.now() - 7200000,
    endTime: Date.now() - 7194000,
    status: 'failed',
    context: {
      referenceProduct: { title: 'Coffee Maker Deluxe', price: 149.99 },
    },
    steps: [
      ...mockExecution.steps.slice(0, 3),
      {
        ...mockExecution.steps[3],
        status: 'failed',
        error: 'LLM API rate limit exceeded',
      },
    ],
  },
];
