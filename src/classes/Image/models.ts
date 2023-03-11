import { z } from "zod"

const imageType = z.enum(['product', 'badge', 'category', 'banner', 'icon']).optional()
const imageId = z.string().regex(/^[\dA-Za-z-]{5,50}$/)

export const uploadInput = z.object({
  content: z.string(),
  imageType,
  name: z.string().optional(),
  imageId: imageId.optional(),
})

export type UploadInput = z.infer<typeof uploadInput>

export const parsedPath = z.object({
  imageId: z.string(),
  width: z.string().optional(),
  height: z.string().optional(),
  quality: z.string().optional(),
  format: z.string().optional(),
  fit: z.string().optional(),
})

export type ParsedPath = z.infer<typeof parsedPath>

export const getImageInput = z.object({
    id: z.string(),
    width: z
      .preprocess((value) => Number.parseInt(value as string, 10), z.number())
      .optional()
      .default(128),
    height: z
      .preprocess((value) => Number.parseInt(value as string, 10), z.number())
      .optional()
      .default(128),
    quality: z.enum(['low', 'default', 'medium', 'high']).optional().default('default'),
    fit: z.enum(['contain', 'cover', 'fill', 'inside', 'outside']).optional().default('inside'),
  })
  
  export type GetImageInput = z.infer<typeof getImageInput>

export const resizedImageParameters = getImageInput.extend({
    content: z.any(),
  })
  
  export type ResizedImageParameters = z.infer<typeof resizedImageParameters>