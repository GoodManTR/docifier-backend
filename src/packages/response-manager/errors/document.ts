import { ErrorType } from "../error-response";

export const Document: Record<number, ErrorType> = {
  5000: {
    classId: 'Document',
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
    classId: 'Document',
    code: 5001,
    statusCode: 400,
    message: {
      en_US: 'Unauthorized!',
      tr_TR: 'Yetkisiz!',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
}
