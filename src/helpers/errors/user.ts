import { ErrorType } from "../error-response";

export const User: Record<number, ErrorType> = {
  5000: {
    classId: 'User',
    code: 5000,
    statusCode: 400,
    message: {
      en_US: 'Something went wrong, please try again later.',
      tr_TR: 'Bir şeyler ters gitti, lütfen daha sonra tekrar dene.',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5001: {
    classId: 'User',
    code: 5000,
    statusCode: 400,
    message: {
      en_US: 'userId is required.',
      tr_TR: 'userId zorunludur.',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
}
