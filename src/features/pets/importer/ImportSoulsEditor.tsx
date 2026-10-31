import { Flex, NativeSelect } from "@chakra-ui/react"
import { SoulProgressField } from "@pets/details/SoulProgressField"
import {
    getLevelStart,
    levelFromSouls,
    PET_LEVELS,
} from "@pets/logic/petLevels"
import type { ChangeEvent } from "react"

type ImportSoulsEditorProps = {
    // Total souls that will be saved.
    souls: number
    onChange: (souls: number) => void
}

// Corrects what was read before it's saved.
export const ImportSoulsEditor = ({
    souls,
    onChange,
}: ImportSoulsEditorProps) => {
    const handleLevelChange = (event: ChangeEvent<HTMLSelectElement>) => {
        onChange(getLevelStart(Number(event.target.value)))
    }

    return (
        <Flex flexWrap="wrap" alignItems="center" gap="1.5">
            <NativeSelect.Root size="xs" w="20" flexShrink="0">
                <NativeSelect.Field
                    value={String(levelFromSouls(souls))}
                    aria-label="Insight level to save"
                    onChange={handleLevelChange}
                >
                    <option value="0">Locked</option>

                    {PET_LEVELS.map((level) => (
                        <option key={level} value={String(level)}>
                            Lv{level}
                        </option>
                    ))}
                </NativeSelect.Field>

                <NativeSelect.Indicator />
            </NativeSelect.Root>

            <SoulProgressField key={souls} souls={souls} onChange={onChange} />
        </Flex>
    )
}
