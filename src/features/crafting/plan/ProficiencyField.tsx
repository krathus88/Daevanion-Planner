import { CompanionLocked } from "@account/CompanionLocked"
import { Flex, NativeSelect, Text } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import {
    LEVELS_PER_RANK,
    PROFESSION_NAMES,
    RANK_NAMES,
    type ProfessionId,
} from "@crafting/config/professions"
import { formatMastery } from "@crafting/logic/recipeLabels"
import { useState, type ChangeEvent } from "react"

type ProficiencyFieldProps = {
    profession: ProfessionId
    // The game's level number (61 is Professional Lv. 11); null is unset.
    value: number | null
    // Filled by the companion app: just the game's level.
    locked?: boolean
    onChange: (profession: ProfessionId, level: number | null) => void
}

const getRank = (value: number) => {
    return Math.min(
        RANK_NAMES.length - 1,
        Math.floor((value - 1) / LEVELS_PER_RANK),
    )
}

// Picked like the game shows it: a rank, then its level 1-50.
export const ProficiencyField = ({
    profession,
    value,
    locked = false,
    onChange,
}: ProficiencyFieldProps) => {
    // Remembers the rank picked while the level is still empty.
    const [pickedRank, setPickedRank] = useState(0)
    const rank = value === null ? pickedRank : getRank(value)
    const level = value === null ? null : value - rank * LEVELS_PER_RANK
    const name = PROFESSION_NAMES[profession]

    const handleRankChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const next = Number(event.target.value)

        setPickedRank(next)

        if (level !== null) {
            onChange(profession, next * LEVELS_PER_RANK + level)
        }
    }

    const handleLevelChange = (event: ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value

        if (text === "") {
            onChange(profession, null)

            return
        }

        const next = Math.min(LEVELS_PER_RANK, Math.max(1, Number(text)))

        onChange(profession, rank * LEVELS_PER_RANK + next)
    }

    return (
        <Flex
            alignItems="center"
            gap="2"
            role="group"
            aria-label={`${name} proficiency`}
        >
            <Text textStyle="caption">{name}</Text>

            {locked && value !== null ? (
                <CompanionLocked locked>
                    <Text
                        color="app.fg"
                        fontSize="xs"
                        fontWeight="semibold"
                        whiteSpace="nowrap"
                    >
                        {formatMastery(value)}
                    </Text>
                </CompanionLocked>
            ) : (
                <Flex gap="1.5">
                    <NativeSelect.Root w="32" size="xs">
                        <NativeSelect.Field
                            value={rank}
                            aria-label={`${name} rank`}
                            onChange={handleRankChange}
                        >
                            {RANK_NAMES.map((rankName, index) => (
                                <option key={rankName} value={index}>
                                    {rankName}
                                </option>
                            ))}
                        </NativeSelect.Field>

                        <NativeSelect.Indicator />
                    </NativeSelect.Root>

                    <WholeNumberInput
                        w="16"
                        size="xs"
                        fallback={null}
                        value={level ?? ""}
                        textAlign="right"
                        placeholder="Lv."
                        aria-label={`${name} level`}
                        onChange={handleLevelChange}
                    />
                </Flex>
            )}
        </Flex>
    )
}
