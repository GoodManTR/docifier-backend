import { z } from "zod";

export const stockStatus = z.enum(["HIGH", "MEDIUM", "LOW", "NONE"])
export type StockStatus = z.infer<typeof stockStatus>

export const userTypes = z.enum(['admin', 'enduser', 'none'])