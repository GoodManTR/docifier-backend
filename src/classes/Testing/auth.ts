import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { encodePassword } from './utils'
import { changePasswordInput, registerInput, signInInput } from './models'
import { Context } from '../../models'
import { firebaseApp } from '../../api'
import { CustomError, Errors, SuccessResponse } from '../../packages/response-manager'
import { AUTH_TABLE } from '../../packages/utils/constants'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const auth = firebaseApp.auth()

// *******************************
// *******************************
// ***** LAMBDA HANDLERS  ********
// *******************************
// *******************************

export const signUp = async (context: Context): Promise<any> => {
  try {
    const input = registerInput.safeParse(context.body)

    if (input.success === false) {
      throw new CustomError({ error: Errors.Auth[5000], addons: { issues: input.error.issues } })
    }

    const { email, password, confirmPassword, name, surname, userType } = input.data

    if (password !== confirmPassword) {
      throw new CustomError({ error: Errors.Auth[5000], addons: { issues: 'Passwords do not match' } })
    }

    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: `${name} ${surname}`,
    })
    const token = await auth.createCustomToken(firebaseUser.uid, {
      email,
      name,
      surname,
      userType,
    })

    const dynamoReq = await dynamo.send(
      new PutCommand({
        TableName: AUTH_TABLE,
        Item: {
          email,
          id: firebaseUser.uid,
          password: encodePassword(password),
          name,
          surname,
          userType,
        },
      }),
    )

    if (dynamoReq.$metadata.httpStatusCode !== 200) {
      throw new CustomError({ error: Errors.Auth[5000], addons: { issues: dynamoReq } })
    }

    return new SuccessResponse({
      body: {
        token,
      },
    }).response
  } catch (error) {
    return error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
  }
}

export const signIn = async (context: Context): Promise<any> => {
  try {
    const _input = signInInput.safeParse(context.body)

    if (_input.success === false) {
      throw new CustomError({ error: Errors.Auth[5000], addons: { issues: _input.error.issues } })
    }

    const { email, password: recivedPassword } = _input.data

    const dynamoReq = await dynamo.send(
      new GetCommand({
        TableName: AUTH_TABLE,
        Key: {
          email,
        },
      }),
    )

    if (!dynamoReq.Item || !dynamoReq.Item.password || dynamoReq.Item.password !== encodePassword(recivedPassword)) {
      throw new CustomError({ error: Errors.Auth[5002], addons: email })
    }

    const firebaseUser = await auth.getUserByEmail(email)
    const token = await auth.createCustomToken(firebaseUser.uid, {
      email,
      name: dynamoReq.Item.name,
      surname: dynamoReq.Item.surname,
      userType: dynamoReq.Item.userType,
    })

    return new SuccessResponse({
      body: {
        token,
      },
    }).response
  } catch (error) {
    return error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
  }
}

export const changePassword = async (context: Context): Promise<any> => {
  try {
    const input = changePasswordInput.safeParse(context.body)
    const { claims } = context

    if (input.success === false) {
      throw new CustomError({ error: Errors.Auth[5000], addons: { issues: input.error.issues } })
    }

    if (!claims.email) {
      throw new CustomError({ error: Errors.Auth[5000] })
    }

    const { oldPassword, newPassword, newPasswordConfirm } = input.data

    const dynamoGetUser = await dynamo.send(
      new GetCommand({
        TableName: AUTH_TABLE,
        Key: {
          email: claims.email,
        },
      }),
    )

    if (!dynamoGetUser.Item || !dynamoGetUser.Item.password) {
      throw new CustomError({ error: Errors.Auth[5002], addons: claims.email })
    }

    // Check if old password is correct
    if (dynamoGetUser.Item.password !== encodePassword(oldPassword)) {
      throw new CustomError({ error: Errors.Auth[5011] })
    }

    // Check if old password is same as new password
    if (dynamoGetUser.Item.password === encodePassword(newPassword)) {
        throw new CustomError({ error: Errors.Auth[5009] })
      }

    // Check if new passwords match
    if (newPassword !== newPasswordConfirm) {
      throw new CustomError({ error: Errors.Auth[5010] })
    }

    // Update password in dynamo
    const dynamoUpdateAuthTable = await dynamo.send(
      new UpdateCommand({
        TableName: AUTH_TABLE,
        Key: {
          email: dynamoGetUser.Item.email,
        },
        UpdateExpression: 'SET #password = :newPassword',
        ExpressionAttributeNames: {
          '#password': 'password',
        },
        ExpressionAttributeValues: {
          ':newPassword': encodePassword(newPassword),
        },
        ReturnValues: 'NONE',
      }),
    )

    if (dynamoUpdateAuthTable.$metadata.httpStatusCode !== 200) {
      throw new CustomError({ error: Errors.Auth[5000], addons: { issues: dynamoUpdateAuthTable } })
    }

    const firebaseUser = await auth.getUserByEmail(claims.email)
    await auth.updateUser(firebaseUser.uid, {
      password: newPassword,
    })

    return new SuccessResponse({
      body: {
        message: 'Password changed successfully',
      },
    }).response
  } catch (error) {
    return error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
  }
}
