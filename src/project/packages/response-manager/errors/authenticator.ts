import { ErrorType } from "../error-response";

export const Authenticator: Record<number, ErrorType> = {
  5000: {
    classId: 'Authenticator',
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
    classId: 'Authenticator',
    code: 5001,
    statusCode: 400,
    message: {
      en_US: 'Check the fields you entered.',
      tr_TR: 'Girdiğiniz alanları kontrol ediniz.',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5002: {
    classId: 'Authenticator',
    code: 5002,
    statusCode: 400,
    message: {
      en_US: 'Passwords do not match!',
      tr_TR: 'Şifreler uyuşmuyor!',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5003: {
    classId: 'Authenticator',
    code: 5003,
    statusCode: 400,
    message: {
      en_US: 'There has been a problem while creating user.',
      tr_TR: 'Kullanıcı oluşturuken bir sorun oluştu.',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5004: {
    classId: 'Authenticator',
    code: 5004,
    statusCode: 400,
    message: {
      en_US: 'The password you entered is wrong!',
      tr_TR: 'Girdiğiniz şifre yanlış!',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5005: {
    classId: 'Authenticator',
    code: 5005,
    statusCode: 400,
    message: {
      en_US: 'User not found',
      tr_TR: 'Kullanıcı bulunamadı.',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5006: {
    classId: 'Authenticator',
    code: 5006,
    statusCode: 400,
    message: {
      en_US: 'There is already a user registered with this email',
      tr_TR: 'Bu email ile kayıtlı bir kullanıcı zaten mevcut',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5007: {
    classId: 'Authenticator',
    code: 5007,
    statusCode: 403,
    message: {
      en_US: 'There has been a problem while validating your token.',
      tr_TR: 'Tokeninizi doğrulamaya çalışırken bir sorun oluştu.',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5008: {
    classId: 'Authenticator',
    code: 5008,
    statusCode: 403,
    message: {
      en_US: 'Token is not created with same IP',
      tr_TR: 'Token aynı IP ile oluşturulmadı',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5009: {
    classId: 'Authenticator',
    code: 5009,
    statusCode: 403,
    message: {
      en_US: 'New password cannot be same as old one',
      tr_TR: 'Yeni şifre eskisiyle aynı olamaz',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5010: {
    classId: 'Authenticator',
    code: 5010,
    statusCode: 403,
    message: {
      en_US: 'Passwords do not match!',
      tr_TR: 'Şifreler uyuşmuyor!',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5011: {
    classId: 'Authenticator',
    code: 5011,
    statusCode: 403,
    message: {
      en_US: 'Old password is incorrect!',
      tr_TR: 'Eski şifre hatalı!',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
}
