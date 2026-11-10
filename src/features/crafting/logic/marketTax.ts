import { MARKET_TAX } from "@crafting/config/market"

// What a sale on the Market pays out, after its tax.
export const afterTax = (price: number) => {
    return price * (1 - MARKET_TAX / 100)
}
