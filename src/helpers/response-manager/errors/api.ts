import { ErrorType } from "../error-response";

export const Api: Record<number, ErrorType> = {
  5000: {
    classId: 'Api',
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
    classId: 'Api',
    code: 5001,
    statusCode: 400,
    message: {
      en_US: 'Router http handler recived invalid path parameters',
      tr_TR: 'Yönlendirici http yöntemi geçersiz yol parametreleri aldı',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5002: {
    classId: 'Api',
    code: 5002,
    statusCode: 400,
    message: {
      en_US: 'Router http handler recived invalid path parameters',
      tr_TR: 'Yönlendirici http yöntemi geçersiz yol parametreleri aldı',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
}
