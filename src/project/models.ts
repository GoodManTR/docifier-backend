import { z } from "zod"
import { userTypes } from "./types"

export const tokenMetaData = z.object({
    userType: userTypes,
    userId: z.string(),
})
export type TokenMetaData = z.infer<typeof tokenMetaData>