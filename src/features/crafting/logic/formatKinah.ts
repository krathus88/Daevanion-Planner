const wholeFormat = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
})

// Grouped whole numbers: 1,250,000.
export const formatCount = (value: number) => {
    return wholeFormat.format(value)
}

// Kinah, rounded to whole; null (unknown) is a dash.
export const formatKinah = (value: number | null) => {
    return value === null
        ? "—"
        : `${wholeFormat.format(Math.round(value))} Kinah`
}
