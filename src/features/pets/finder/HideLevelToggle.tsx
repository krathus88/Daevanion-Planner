import { chakra } from "@chakra-ui/react"
import { LEVEL_COLORS } from "@pets/logic/petLevels"

type HideLevelToggleProps = {
    level: number
    hidden: boolean
    onChange: (level: number, hidden: boolean) => void
}

// One chip of the "Hide" multi-select, in its level's color when picked.
export const HideLevelToggle = ({
    level,
    hidden,
    onChange,
}: HideLevelToggleProps) => {
    const colors = LEVEL_COLORS[level]

    const handleClick = () => {
        onChange(level, !hidden)
    }

    return (
        <chakra.button
            px="3"
            py="1"
            flex="1"
            bg={hidden ? colors.bg : "transparent"}
            borderWidth="1px"
            borderColor={hidden ? colors.fg : "app.border"}
            borderRadius="md"
            color={hidden ? colors.fg : "app.muted"}
            fontSize="sm"
            fontWeight="semibold"
            cursor="button"
            _hover={hidden ? undefined : { bg: "app.hover", color: colors.fg }}
            type="button"
            aria-pressed={hidden}
            onClick={handleClick}
        >
            Lv{level}
        </chakra.button>
    )
}
