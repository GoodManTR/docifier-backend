import { ErrorType } from "../error-response";

export const System: Record<number, ErrorType> = {
  5000: {
    classId: 'System',
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
    classId: 'System',
    code: 5001,
    statusCode: 500,
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
    classId: 'System',
    code: 5002,
    statusCode: 500,
    message: {
      en_US: 'Method "{{methodName}}" is not defined in template.yml',
      tr_TR: 'Method "{{methodName}}" template.yml içinde tanımlı değil',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5003: {
    classId: 'System',
    code: 5003,
    statusCode: 500,
    message: {
      en_US: 'Instance id is required for method "{{methodName}}" in class {{classId}}',
      tr_TR: '{{classId}} sınıfındaki "{{methodName}}" methodu için instance id gereklidir',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5004: {
    classId: 'System',
    code: 5004,
    statusCode: 500,
    message: {
      en_US: 'Instance with id {{instanceId}} does not exist in class {{classId}}',
      tr_TR: '{{classId}} sınıfında idsi {{instanceId}} olan instance bulunamadı',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5005: {
    classId: 'System',
    code: 5005,
    statusCode: 570,
    message: {
      en_US: 'Please try again later. Instance with id {{instanceId}} is locked in class {{classId}}',
      tr_TR: 'Lütfen daha sonra tekrar dene. {{classId}} sınıfında idsi {{instanceId}} olan instance kilitli',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5006: {
    classId: 'System',
    code: 5006,
    statusCode: 500,
    message: {
      en_US: 'Init method is not defined in template.yml',
      tr_TR: 'Init methodu template.yml içinde tanımlı değil',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
  5007: {
    classId: 'System',
    code: 5007,
    statusCode: 500,
    message: {
      en_US: 'AUTH handler recived unknown endpoint: {{authEndpoint}}',
      tr_TR: 'AUTH handler bilinmeyen endpoint aldı: {{authEndpoint}}',
    },
    title: {
      en_US: 'Error',
      tr_TR: 'Hata',
    },
  },
}
