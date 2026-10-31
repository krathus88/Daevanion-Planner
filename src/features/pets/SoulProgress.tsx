import { Text } from "@chakra-ui/react"
import { getProgressText } from "@pets/logic/petLevels"

type SoulProgressProps = {
    // The pet's total souls.
    souls: number
}

// "51/75" towards the next level, like the game's card. Nothing at Lv3, or for
// a locked pet without souls.
export const SoulProgress = ({ souls }: SoulProgressProps) => {
    const text = getProgressText(souls)

    if (text === null) {
        return null
    }

    return (
        <Text as="span" flexShrink="0" textStyle="caption" whiteSpace="nowrap">
            {text}
        </Text>
    )
}
