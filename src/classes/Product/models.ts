import { z } from 'zod'

export const productAnalytics = z.object({
    viewCount: z.number().default(0),
    salesCount: z.number().default(0),
    favoriteCount: z.number().default(0)
  }).default({})

export const productPriceTag = z.object({
    currency: z.string().default('TRY'),
    discountRate: z.number().default(0),
    discountRateLabel: z.string().default(''),
    discountedPrice: z.number().default(0),
    discountedPriceLabel: z.string().default(''),
    normalPrice: z.number().default(0),
    normalPriceLabel: z.string().default(''),
})
export type ProductPriceTag = z.infer<typeof productPriceTag>

export const productAttributes = z.object({
    brand: z.string().nullable().default(''),
    shortName: z.string().nullable().default(''),
    categories: z.array(z.string()).default([]),
    productDescription: z.string().nullable().default(''),
    salesUnit: z.enum(['AD','KG']).nullable().default(null),
    newProducts: z.boolean().nullable().default(false),
    promotedProducts: z.boolean().nullable().default(false),
    topSeller: z.boolean().nullable().default(false),
    size: z.string().nullable().default(''),
    taxValue: z.string().nullable().default(''),
})
export type ProductAttributes = z.infer<typeof productAttributes>

export const productSchema = z.object({
    productId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    prices: productPriceTag.default({}),
    analytics: productAnalytics, 
    stock: z.number().optional(),
    attributes: productAttributes.default({}),
})
export type ProductSchema = z.infer<typeof productSchema>

export const upsertProductInput = productSchema

// ------ SEARCH ----- //
export const PriceRange = z.object({
    min: z.number().default(1),
    max: z.number().default(10_000_000),
  })
  
  export type PriceRange = z.infer<typeof PriceRange>
  
  const FilterValue = z.object({
    label: z.string().optional(),
    value: z.string().optional(),
    filtered: z.boolean().optional(),
    count: z.number().optional(), // Aggregation count,
  })
  
  export type FilterValue = z.infer<typeof FilterValue>
  
  export const Filter = z.object({
    filterId: z.string(),
    filterType: z.string(),
    fieldName: z.string(),
    label: z.string().optional(),
    visibility: z.boolean().optional(),
    values: z.array(FilterValue).optional().default([]),
    order: z.number().optional().default(0),
    totalCount: z.number().optional(),
  })
  
  export type Filter = z.infer<typeof Filter>
  
  export const SearchFilterValue = z.object({
    filterId: z.string().default(''),
    filterValues: z.array(z.unknown()).default([]),
    excludedValues: z.array(z.unknown()).default([]),
  })
  
  export type SearchFilterValue = z.infer<typeof SearchFilterValue>
  
  export const SortBy = z.object({
    attribute: z.string(),
    order: z.enum(['asc', 'desc']),
  })
  
  export const SearchRequest = z.object({
    searchTerm: z.string().optional(),
    from: z.number().optional().default(0),
    size: z.number().optional().default(20),
    filters: z.array(SearchFilterValue).optional(),
    inStock: z.boolean().optional(),
    priceRange: PriceRange.optional(),
    sortBy: z.array(SortBy).optional(),
  })
  
  export type SearchRequest = z.infer<typeof SearchRequest>
  
  export const modelConfig = z.object({
    filters: z.array(Filter),
  })
  export type ModelConfig = z.infer<typeof modelConfig>
  
  export const searchInput = z.object({
    query: SearchRequest,
  })
  export type SearchInput = z.infer<typeof searchInput>
  
  export const searchOutput = z.object({
    data: z.array(productSchema),
  })
  export type SearchOutput = z.infer<typeof searchOutput>
  
  export const aggregateOutput = z.object({
    data: z.array(Filter),
  })
  export type AggregateOutput = z.infer<typeof aggregateOutput>