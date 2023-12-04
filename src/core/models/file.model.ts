import * as z from 'zod'

export const setFileInput = z.object({
  filename: z.string().min(1),
  body: z.string().min(1),
})
export type SetFileInput = z.infer<typeof setFileInput>

export const setFileOutput = z.object({
  success: z.boolean(),
  error: z.string().optional(),
})
export type SetFileOutput = z.infer<typeof setFileOutput>

export const getFileInput = z.object({
  filename: z.string().min(1),
})
export type GetFileInput = z.infer<typeof getFileInput>

export const getFileOutput = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  data: z.any().optional(),
})
export type GetFileOutput = z.infer<typeof getFileOutput>

export const deleteFileInput = z.object({
  filename: z.string().min(1),
})
export type DeleteFileInput = z.infer<typeof deleteFileInput>

export const deleteFileOutput = z.object({
  success: z.boolean(),
  error: z.string().optional(),
})
export type DeleteFileOutput = z.infer<typeof deleteFileOutput>
