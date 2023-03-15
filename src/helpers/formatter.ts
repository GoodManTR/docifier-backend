import { StockStatus, stockStatus } from "../types";

export function formatSinglePrice(price: number): string {
    return `${(price / 100).toFixed(2).replace('.', ',')} TL`;
  }
  
  export function discountRate(price: number, discountedPrice: number): number {
    return Math.round(((price - discountedPrice) / price) * 100)
  }
  
  export function priceMapper(normalPrice: number, discountedPrice: number) {
    return {
        discountedPrice,
        normalPrice,
        discountedPriceLabel: formatSinglePrice(discountedPrice),
        normalPriceLabel: formatSinglePrice(normalPrice),
        discountRate: discountRate(normalPrice, discountedPrice),
        discountRateLabel: `%${String(discountRate(normalPrice, discountedPrice))}`,
    };
  }
  
  export function stockStatusControl(stock: number): StockStatus {
    let selectStockStatus: StockStatus
  
    switch (true) {
      case (stock > 0 && stock < 10):
        selectStockStatus = stockStatus.Enum.LOW
        break
      case (stock >= 10 && stock < 20):
        selectStockStatus = stockStatus.Enum.MEDIUM
        break
      case (stock >= 20):
        selectStockStatus = stockStatus.Enum.HIGH
        break
      default:
        selectStockStatus = stockStatus.Enum.NONE
    }
  
    return selectStockStatus as StockStatus
  }
  