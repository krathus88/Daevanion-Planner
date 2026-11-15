// Deals cards into columns in order, each into the column with the least
// weight so far (the leftmost on a tie), and gives each column's card indexes.
// Cards of one weight go left to right, one per column in turn.
export const dealCards = (weights: readonly number[], count: number) => {
    const columns: number[][] = []
    const totals: number[] = []

    for (let index = 0; index < count; index++) {
        columns.push([])
        totals.push(0)
    }

    weights.forEach((weight, card) => {
        const lightest = totals.indexOf(Math.min(...totals))

        columns[lightest].push(card)
        totals[lightest] += weight
    })

    return columns
}
