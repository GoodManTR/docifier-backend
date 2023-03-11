import { z } from 'zod'

export const productSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    stock: z.number().optional()
})

export const upsertProductInput = productSchema