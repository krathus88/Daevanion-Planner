import { Text } from "@chakra-ui/react"
import { splitTooltip } from "@planner/logic/tooltipParts"

type AbilityTooltipTextProps = {
    text: string
}

// Inline text whose per-level values (X) use the game's highlight color.
export const AbilityTooltipText = ({ text }: AbilityTooltipTextProps) => {
    const parts = splitTooltip(text)

    return parts.map((part, index) =>
        part.scaling ? (
            <Text
                key={index}
                as="span"
                color="board.scaling"
                fontWeight="semibold"
            >
                {part.text}
            </Text>
        ) : (
            part.text
        ),
    )
}
