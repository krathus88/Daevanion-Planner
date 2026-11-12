import { CompanionLocked } from "@account/CompanionLocked"
import { useCompanionLocked } from "@account/companionLockedContext"
import { Flex, Text } from "@chakra-ui/react"
import { NumberField } from "@common/NumberField"
import { MAX_AMOUNT } from "@crafting/storage/craftingSettings"
import { formatCount } from "@crafting/logic/formatKinah"

type BagCountFieldProps = {
    owned: number
    onChange: (value: number | null) => void
}

// "In the bag" under a craft: a field, or the game's count while the
// companion app fills it.
export const BagCountField = ({ owned, onChange }: BagCountFieldProps) => {
    const locked = useCompanionLocked()

    if (!locked) {
        return (
            <NumberField
                value={owned}
                label="In the bag"
                max={MAX_AMOUNT}
                onChange={onChange}
            />
        )
    }

    return (
        <Flex minW="0" flexDir="column" gap="0.5">
            <Text textStyle="caption">In the bag</Text>

            <Flex h="8" alignItems="center" justifyContent="flex-end">
                <CompanionLocked locked>
                    <Text
                        color="app.fg"
                        fontSize="sm"
                        fontWeight="semibold"
                        fontVariantNumeric="tabular-nums"
                        aria-label={`In the bag: ${owned}`}
                    >
                        {formatCount(owned)}
                    </Text>
                </CompanionLocked>
            </Flex>
        </Flex>
    )
}
