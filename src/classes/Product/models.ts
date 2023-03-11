import { z } from 'zod'

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

export const productSchema = z.object({
    productId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    prices: productPriceTag.default({}),
    stock: z.number().optional(),
    attributes: z.object({
        color: z.string().optional(),
        size: z.string().optional(),
    }).default({}),
})

export const upsertProductInput = productSchema