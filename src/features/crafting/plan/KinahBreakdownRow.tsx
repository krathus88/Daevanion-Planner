import { Text } from "@chakra-ui/react"
import { formatCount } from "@crafting/logic/formatKinah"
import type { KinahRow } from "@crafting/logic/kinahBreakdown"

type KinahBreakdownRowProps = {
    row: KinahRow
    // Coloured by its sign: a profit.
    signed: boolean
}

const format = (value: number) => {
    const rounded = Math.round(value)

    return rounded < 0 ? `−${formatCount(-rounded)}` : formatCount(rounded)
}

const getColor = (row: KinahRow, signed: boolean) => {
    if (!signed) {
        return "app.fg"
    }

    return row.value >= 0 ? "app.success" : "app.danger"
}

// One line of a Kinah breakdown: label, then the amount on the right; a
// total gets a rule above it.
export const KinahBreakdownRow = ({ row, signed }: KinahBreakdownRowProps) => {
    const rule = row.total ? "1px" : "0"

    return (
        <>
            <Text
                pt={row.total ? "1" : "0"}
                borderTopWidth={rule}
                borderColor="app.borderStrong"
                color={row.total ? "app.fg" : "app.muted"}
                fontWeight={row.total ? "semibold" : "normal"}
            >
                {row.label}
            </Text>

            <Text
                pt={row.total ? "1" : "0"}
                borderTopWidth={rule}
                borderColor="app.borderStrong"
                color={getColor(row, signed)}
                fontWeight={row.total ? "semibold" : "normal"}
                fontVariantNumeric="tabular-nums"
                textAlign="right"
            >
                {format(row.value)}
            </Text>
        </>
    )
}
