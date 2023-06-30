import * as crypto from 'crypto';

export const encodePassword = (password: string) => crypto.createHash('sha3-512').update(password).digest('hex')