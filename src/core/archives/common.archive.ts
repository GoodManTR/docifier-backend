import { VerifyOptions } from "jsonwebtoken"

export function getVerifyOptionsWithMaxAge() {
      let options: VerifyOptions = {}
      const tokenMaxAge = parseInt(process.env.TOKEN_VERIFY_MAX_AGE || '0') || 0

      if (tokenMaxAge > 0) {
          options.ignoreExpiration = true
          options.maxAge = tokenMaxAge
      }
      return options
  }