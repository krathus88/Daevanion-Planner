// Crafting item icons (© NCSOFT) by item id, from AION 2 Hub;
// `npm run crafting:data` downloads new ones.
const icons = import.meta.glob<string>("./*.webp", {
    eager: true,
    import: "default",
})

export const getCraftingIconUrl = (itemId: number) => {
    return icons[`./${itemId}.webp`]
}
