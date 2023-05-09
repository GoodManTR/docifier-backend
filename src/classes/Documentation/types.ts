import { z } from 'zod'

export const itemTypes = z.enum(['folder', 'document'])

export const docTreeItem = z.lazy(() =>
  z.object({
    itemId: z.string(),
    itemType: itemTypes,
    children: z.array(docTreeItem).default([]).optional(),
  })
);

export type DocTreeItem = z.infer<typeof docTreeItem>