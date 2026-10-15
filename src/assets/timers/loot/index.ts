// Item icons from the global client, keyed by file name without ".webp".
const icons = import.meta.glob<string>("./*.webp", {
    eager: true,
    import: "default",
})

export const getLootIcon = (key: string) => {
    return icons[`./${key}.webp`]
}
