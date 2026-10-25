// Pet portraits, named after the game's portrait files; `npm run pets:data`
// downloads new ones.
const icons = import.meta.glob<string>("./*.webp", {
    eager: true,
    import: "default",
})

export const getPetIconUrl = (icon: string | undefined) => {
    return icon ? icons[`./${icon}.webp`] : undefined
}
