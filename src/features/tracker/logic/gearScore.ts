// A power score the way the game shows it: thousands with one decimal, cut
// rather than rounded (183,566 is 183.5k).
export const formatPower = (power: number) => {
    if (power < 1000) {
        return String(power)
    }

    return `${(Math.floor(power / 100) / 10).toFixed(1)}k`
}
