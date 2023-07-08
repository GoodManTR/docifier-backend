import { ErrorType } from "../error-response";

export const Auth: Record<number, ErrorType> = {
  5000: {
    classId: 'Auth',
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
    classId: 'Auth',
    code: 5000,
    statusCode: 400,
    message: {
      en_US: 'User with this email already exists!',
      tr_TR: 'Bu e-posta ile kayıtlı bir kullanıcı zaten var!',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5002: {
    classId: 'Auth',
    code: 5002,
    statusCode: 400,
    message: {
      en_US: 'User with this email does not exist or Incorrect password!',
      tr_TR: 'Bu e-posta ile kayıtlı bir kullanıcı yok veya şifre yanlış!',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5003: {
    classId: 'Auth',
    code: 5003,
    statusCode: 403,
    message: {
      en_US: 'There has been problem whit your token',
      tr_TR: 'Tokeninizle ilgili bir sorun oluştu',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5004: {
    classId: 'Auth',
    code: 5004,
    statusCode: 403,
    message: {
      en_US: 'There has been a problem while authorizing your token.',
      tr_TR: 'Tokeninizi yetkilendirmeye çalışırken bir sorun oluştu.',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5005: {
    classId: 'Auth',
    code: 5005,
    statusCode: 403,
    message: {
      en_US: 'You are not authorized to terminate this session.',
      tr_TR: 'Bu oturumu sonlandırmaya yetkiniz yok.',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5006: {
    classId: 'Auth',
    code: 5006,
    statusCode: 403,
    message: {
      en_US: 'There has been a problem while terminating your session.',
      tr_TR: 'Oturumunuzu sonlandırmaya çalışırken bir sorun oluştu.',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5007: {
    classId: 'Auth',
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
    classId: 'Auth',
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
    classId: 'Auth',
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
    classId: 'Auth',
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
}
