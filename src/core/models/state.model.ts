import { z } from 'zod'

export const state = z.object({
      private: z.record(z.any()),
      public: z.record(z.any()),
})

export type State = z.infer<typeof state>
