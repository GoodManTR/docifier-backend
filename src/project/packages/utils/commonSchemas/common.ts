import { z } from 'zod'

export const msisdn = z.string().regex(/^90\d{10}$/)

export const acceptableCultures = z.enum(['tr_TR', 'en_US'])
export const platformEnum = z.enum(['WEB', 'IOS', 'ANDROID', 'HUAWEI'])
export const stages = z.enum(['dev', 'test', 'uat', 'preprod', 'prod'])
export const userIdentities = z.enum(['enduser', 'developer', 'anonymous_user', 'cron', 'backoffice_user'])
export const classIdentities = z.enum([
  'User',
  'CMS',
  'MsisdnAuthenticator',
  'Cart',
  'Catalog',
  'Places',
  'Product',
  'StoreManager',
  'BackofficeUser',
  'BackofficeManager',
  'Billing',
  'Order',
  'ProductContentManager',
  'Bootloader',
  'Image',
  'ProductAnalyticsManager',
  'AlertManager',
  'Category',
  'Mail',
  'Store',
  'ReportManager',
  'Polygon',
  'SearchAnalytics',
  'PromotionManager',
  'Recipe',
  'RecipeManager',
  'Ayen',
  'MissingAddresses',
])
export const deliveryTypes = z.enum(['kargo', 'kurye', 'gelal'])
export type DeliveryTypes = z.infer<typeof deliveryTypes>
export const deliveryType = z.object({
  kurye: z.boolean().default(false),
  kargo: z.boolean().default(false),
  gelal: z.boolean().default(false),
})
export type DeliveryType = z.infer<typeof deliveryType>

export const orderStatus = z.enum([
  'PENDING_PAYMENT',
  'PAYMENT_FAILED',
  'NEW',
  'PREPARING',
  'READY_FOR_TRANSIT',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
])
export type OrderStatus = z.infer<typeof orderStatus>

export const mapAstronStatus = {
  0: 'NEW',
  3: 'PREPARING',
  4: 'READY_FOR_TRANSIT',
  5: 'IN_TRANSIT',
  6: 'DELIVERED',
  7: 'CANCELLED',
}

export const mapToAstronStatus = {
  NEW: '0',
  PREPARING: '3',
  READY_FOR_TRANSIT: '4',
  IN_TRANSIT: '5',
  DELIVERED: '6',
  CANCELLED: '7',
}
