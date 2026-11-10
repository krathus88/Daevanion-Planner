// What a plan's fields report, passed down the craft tree together.
export type PlanHandlers = {
    onOwnedChange: (itemId: number, owned: number) => void
    onSuccessChange: (itemId: number, success: number | null) => void
    onPriceChange: (itemId: number, price: number | null) => void
    onBoughtChange: (itemId: number, bought: boolean) => void
    // Opens another item's craft.
    onItemSelect: (itemId: number) => void
}
