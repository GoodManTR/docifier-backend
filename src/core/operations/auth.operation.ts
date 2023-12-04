import { FirebaseApp } from "../firebase"
import { GenerateCustomTokenInput } from "../models/auth.model"

export const generateCustomToken = async (input: GenerateCustomTokenInput): Promise<any> => {
      const firebase = new FirebaseApp()
      const claims = {
            ...input.claims,
            identity: input.identity,
      }
      const token = await firebase.generateClientToken(input.userId, claims)

      return token
}