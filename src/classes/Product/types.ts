import { z } from "zod"

export const methods = z.enum([
    'search',
    'aggregate',
    'upsertProduct'
])

export const allowedMethods = z.enum([
    'search',
    'aggregate',
])
