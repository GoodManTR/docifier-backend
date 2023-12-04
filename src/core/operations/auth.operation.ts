import { FirebaseApp } from "../firebase"
import { GenerateCustomTokenInput } from "../models/auth.model"

export const generateCustomToken = async (input: GenerateCustomTokenInput): Promise<any> => {
      const firebase = new FirebaseApp()
      const token = await firebase.generateClientToken(input.userId, input.claims)

      return token
}