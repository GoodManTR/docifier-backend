import { Data } from '../models/data.model'
import { ScheduleMessage } from '../models/queue.model'
import { runFunctionEnum } from 'core/models/call.model'
import { runFunction } from 'core/helpers'

export async function handler(payload: ScheduleMessage): Promise<any> {
  try {
    const { classId, methodName: reqMethod, instanceId, body, context } = payload

    const data = {
      context,
      state: {
        public: {},
        private: {},
      },
      request: {
        httpMethod: 'POST',
        body: body,
        headers: context.headers,
        queryStringParams: {},
        pathParameters: {},
      },
      response: {
        statusCode: 200,
        body: {},
      },
      jobs: [],
    } as Data

    if (reqMethod === 'INIT' || reqMethod === 'GET') {
      await runFunction({
        classId,
        instanceId,
        data,
        type: runFunctionEnum.Enum.instance,
      })
    } else {
      await runFunction({
        classId,
        methodName: reqMethod,
        instanceId,
        data,
        type: runFunctionEnum.Enum.method,
      })
    }
  } catch (error) {}
}
