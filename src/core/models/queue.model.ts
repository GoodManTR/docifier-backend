import { Context } from './data.model'

export interface ScheduleMessage {
  classId: string
  instanceId?: string
  methodName: string
  body: any
  context: Context
  after: number
}
