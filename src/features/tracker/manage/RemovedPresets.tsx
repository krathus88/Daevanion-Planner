import { Flex, Text } from "@chakra-ui/react"
import type { TrackerTask } from "@tracker/types"
import { RemovedPresetRow } from "./RemovedPresetRow"

type RemovedPresetsProps = {
    presets: readonly TrackerTask[]
    onRestore: (id: string) => void
}

// Starter tasks the user removed, kept here to add back.
export const RemovedPresets = ({ presets, onRestore }: RemovedPresetsProps) => {
    return (
        <Flex
            as="section"
            flexDir="column"
            gap="2"
            aria-label="Removed presets"
        >
            <Text textStyle="label">Removed presets</Text>

            {presets.map((preset) => (
                <RemovedPresetRow
                    key={preset.id}
                    preset={preset}
                    onRestore={onRestore}
                />
            ))}
        </Flex>
    )
}
