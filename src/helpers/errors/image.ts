import { ErrorType } from "../error-response";

export const Image: Record<number, ErrorType> = {
  5000: {
    classId: 'Image',
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
    classId: 'Image',
    code: 5001,
    statusCode: 400,
    message: {
      en_US: 'Image not found!',
      tr_TR: 'Resim bulunamadı!',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5002: {
    classId: 'Image',
    code: 5001,
    statusCode: 400,
    message: {
      en_US: 'Content is not base-64 format!',
      tr_TR: 'İçerik base-64 formatında değil!',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
}
