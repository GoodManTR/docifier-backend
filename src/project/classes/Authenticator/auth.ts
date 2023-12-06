import { generateCustomToken, getInstance, getReferenceKey } from '../../../core'
import { CustomError, Errors, SuccessResponse } from '../../packages/response-manager'
import { classIdentities, userIdentities } from '../../packages/utils/commonSchemas/common'
import { generateHash } from '../../packages/utils/helpers'
import { LoginInput, loginInput } from './models'
import { ClassData } from './types'

export const login = async (data: ClassData<LoginInput>) => {
  try {
    const input = loginInput.safeParse(data.request.body)
    if (!input.success) {
      throw new CustomError({ error: Errors.Authenticator[5001] })
    }

    const { email } = data.state.private
    const { password } = input.data
    const reqPasswordHash = generateHash(password)

    if (reqPasswordHash !== data.state.private.passwordHash) {
      throw new CustomError({ error: Errors.Authenticator[5004] })
    }

    const userInstance = await getReferenceKey({
      classId: classIdentities.Enum.User,
      key: {
        name: 'email',
        value: email,
      },
    })

    if (!userInstance.success) {
      throw new CustomError({ error: Errors.Authenticator[5005] })
    }

    const token = await generateCustomToken({
      identity: userIdentities.Enum.enduser,
      userId: data.state.private.userId,
      claims: {
        email,
      },
    })

    data.response = new SuccessResponse({
      body: {
        token,
        instance: data.state.private.userId,
      },
    }).response
  } catch (error) {
    data.response = error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
  }
  return data
}
