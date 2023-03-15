import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { USER_TABLE } from '../../helpers/constants'
import { ExaminatorResponse, Response } from '../../helpers/response'
import { UserMetaData } from './types'
import { createSession, terminateSession } from './authorization'
import { encodePassword } from './utils'
import { registerInput, signInInput, signOutInput } from './models'
import { v4 as uuidv4 } from 'uuid';
import { Context } from '../../models'

const client = new DynamoDBClient({})

const dynamo = DynamoDBDocumentClient.from(client)

// *******************************
// *******************************
// ***** LAMBDA HANDLERS  ********
// *******************************
// *******************************

export async function signUp (context: Context): Promise<ExaminatorResponse> {
  try {
    const _input = registerInput.safeParse(context.body)

    if (_input.success === false) {
      throw new Response({ statusCode: 400, message: 'Woops! It looks like you sent us the wrong data. Double-check your request and try again.', addons: { issues: _input.error.issues } })
    }

    const { email, password, userTypes } = _input.data

    const checkExistingUser = await dynamo.send(
      new GetCommand({
        TableName: USER_TABLE,
        Key: {
          email,
        },
      }),
    )

    if (checkExistingUser.Item) {
      throw new Response({ statusCode: 400, message: 'User with this email already exists !', addons: { email } })
    }

    const newId = uuidv4().replace(/-/g, '')

    const user: UserMetaData = {
      type: userTypes,
      email,
      id: newId,
      password: encodePassword(password),
    }

    const dynamoReq = await dynamo.send(
      new PutCommand({
        TableName: USER_TABLE,
        Item: user,
      }),
    )

    if (dynamoReq.$metadata.httpStatusCode !== 200) {
      throw new Response({ statusCode: 400, message: 'Database Error, please contact admin !', addons: { error: dynamoReq } })
    }

    const session = await createSession({ userId: user.id, userType: user.type }, context.sourceIp)

    return new Response({ statusCode: 200, body: session }).response
  } catch (error) {
    return error instanceof Response ? error.response : new Response({ statusCode: 400, message: 'Generic Examinator Error', addons: { error: error } }).response
  }
}

export const signIn = async (context: Context): Promise<ExaminatorResponse> => {
    try {
      const _input = signInInput.safeParse(context.body)
  
      if (_input.success === false) {
        throw new Response({ statusCode: 400, message: 'Woops! It looks like you sent us the wrong data. Double-check your request and try again.',  addons: { issues: _input.error.issues } })
      }
  
      const { email, password: recivedPassword } = _input.data
  
      const dynamoReq = await dynamo.send(
        new GetCommand({
          TableName: USER_TABLE,
          Key: {
            email,
          },
        }),
      )
  
      if (!dynamoReq.Item || !dynamoReq.Item.password || dynamoReq.Item.password !== encodePassword(recivedPassword)) {
        throw new Response({ statusCode: 400, message: 'User with this email does not exist or Incorrect password !' })
      }
  
      const user = dynamoReq.Item as UserMetaData
  
      const session = await createSession({ userId: user.id, userType: user.type }, context.sourceIp)
  
      return new Response({ statusCode: 200, body: session }).response
    } catch (error) {
      return error instanceof Response ? error.response : new Response({ statusCode: 400, message: 'Generic Error', addons: { error: error } }).response
    }
  }

  export const signOut = async (context: Context): Promise<ExaminatorResponse> => {
    try {
      const _input = signOutInput.safeParse(context.body)
  
      if (_input.success === false) {
        throw new Response({ statusCode: 400, message: 'Woops! It looks like you sent us the wrong data. Double-check your request and try again.',  addons: { issues: _input.error.issues } })
      }
  
      const _token = context.headers['_token']
  
      const res = await terminateSession(_token!, _input.data.userId)
  
      return new Response({ statusCode: 200, body: { success: true, res } }).response
    } catch (error) {
      return error instanceof Response ? error.response : new Response({ message: 'Generic Examinator Error', statusCode: 400, addons: { error: error } }).response
    }
  }