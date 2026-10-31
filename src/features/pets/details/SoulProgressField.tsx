import { Flex, Text } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import {
    getLevelNeeded,
    getLevelStart,
    levelFromSouls,
    MAX_PET_LEVEL,
} from "@pets/logic/petLevels"
import { useState, type ChangeEvent, type KeyboardEvent } from "react"

type SoulProgressFieldProps = {
    // The pet's total souls.
    souls: number
    onChange: (souls: number) => void
}

// Souls towards the next level, typed like the game shows them. Saved on Enter
// or leaving the field, so a half-typed number can't change the level.
export const SoulProgressField = ({
    souls,
    onChange,
}: SoulProgressFieldProps) => {
    const level = levelFromSouls(souls)
    const start = getLevelStart(level)

    const [draft, setDraft] = useState(String(souls - start))

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setDraft(event.target.value)
    }

    const commit = () => {
        const needed = getLevelNeeded(level)
        const progress = Math.min(Number(draft), needed)

        setDraft(String(progress))

        if (start + progress !== souls) {
            onChange(start + progress)
        }
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            commit()
        }
    }

    if (level === MAX_PET_LEVEL) {
        return null
    }

    return (
        <Flex alignItems="center" gap="1.5">
            <Text textStyle="label">Souls</Text>

            <WholeNumberInput
                size="xs"
                w="10"
                textAlign="center"
                value={draft}
                aria-label="Souls towards the next level"
                onChange={handleChange}
                onBlur={commit}
                onKeyDown={handleKeyDown}
            />

            <Text textStyle="caption">/ {getLevelNeeded(level)}</Text>
        </Flex>
    )
}
