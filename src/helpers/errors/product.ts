import { ErrorType } from "../error-response";

export const Product: Record<number, ErrorType> = {
  5000: {
    classId: 'Product',
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
    classId: 'Product',
    code: 5000,
    statusCode: 400,
    message: {
      en_US: 'Could find a field with this filter id!',
      tr_TR: 'Bu filtre id ile bir alan bulunamadı!',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
}
