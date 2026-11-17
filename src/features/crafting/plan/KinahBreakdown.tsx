import { Grid, Text } from "@chakra-ui/react"
import type { KinahRow } from "@crafting/logic/kinahBreakdown"
import { KinahBreakdownRow } from "./KinahBreakdownRow"

type KinahBreakdownProps = {
    rows: KinahRow[]
    // Colour the last row by its sign (a profit).
    signed?: boolean
    caption: string
}

// A hover's small table: how an amount adds up, label left, Kinah right.
export const KinahBreakdown = ({
    rows,
    signed = false,
    caption,
}: KinahBreakdownProps) => {
    return (
        <Grid py="1" gridTemplateColumns="auto auto" columnGap="6" rowGap="1">
            <Text gridColumn="span 2" textStyle="caption">
                {caption}
            </Text>

            {rows.map((row, index) => (
                <KinahBreakdownRow
                    key={row.label}
                    row={row}
                    signed={signed && index === rows.length - 1}
                />
            ))}
        </Grid>
    )
}
