import { z } from 'zod'
import { Data } from '../../../core'

export const publicState = z.object({})
export const privateState = z.object({
  email: z.string().email(),
  passwordHash: z.string(),
})

export const state = z.object({
  public: publicState,
  private: privateState,
})

export type State = z.infer<typeof state>

export type StatelessData<Input extends any = any, Output extends any = any> = Omit<Data<Input, Output>, 'state'>
export interface ClassData<I extends any = any, O extends any = any> extends StatelessData<I, O> {
  state: State
}