import type { ConflictSummaryRow } from "@account/sync/conflictSummary"
import { Text } from "@chakra-ui/react"
import { ConflictSide } from "./ConflictSide"

type ConflictRowProps = {
    row: ConflictSummaryRow
}

// Three cells of the dialog's grid: what, this device, the account.
export const ConflictRow = ({ row }: ConflictRowProps) => {
    return (
        <>
            <Text fontSize="sm" fontWeight="semibold">
                {row.label}
            </Text>

            <ConflictSide side={row.device} />

            <ConflictSide side={row.account} />
        </>
    )
}
