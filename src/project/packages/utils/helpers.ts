import crypto from 'node:crypto'

export function generateHash(payload: object | string): string {
      return crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex')
}