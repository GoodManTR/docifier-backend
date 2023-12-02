import { z } from "zod";

export const userTypes = z.enum(['admin', 'enduser', 'none'])