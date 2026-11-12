import type { ServerCharacter } from "@account/game/gameCharacters"
import {
    createListCollection,
    Flex,
    Portal,
    Select,
    type SelectValueChangeDetails,
} from "@chakra-ui/react"
import { IconImage } from "@common/IconImage"
import { CLASS_ICONS } from "@config/classPresets"

type CharacterSelectProps = {
    value: string | null
    characters: ServerCharacter[]
    onChange: (name: string | null) => void
}

// Select needs a value for "none".
const NO_CHARACTER = ""

// Whose soulbound items count as owned: the companion app's characters on
// the server, each with its class icon, like the header's class picker.
export const CharacterSelect = ({
    value,
    characters,
    onChange,
}: CharacterSelectProps) => {
    const collection = createListCollection({
        items: [
            { label: "No character", value: NO_CHARACTER, icon: undefined },
            ...characters.map((character) => ({
                label: character.name,
                value: character.name,
                icon:
                    character.classId === null
                        ? undefined
                        : CLASS_ICONS[character.classId],
            })),
        ],
    })
    const selected = collection.items.find((item) => {
        return item.value === (value ?? NO_CHARACTER)
    })

    const handleValueChange = (details: SelectValueChangeDetails) => {
        const next = details.value[0] ?? NO_CHARACTER

        onChange(next === NO_CHARACTER ? null : next)
    }

    return (
        <Select.Root
            size="sm"
            collection={collection}
            value={[value ?? NO_CHARACTER]}
            w="serverSelect"
            flexShrink="0"
            positioning={{ sameWidth: true }}
            onValueChange={handleValueChange}
        >
            <Select.HiddenSelect />

            <Select.Label srOnly>Character</Select.Label>

            <Select.Control title="Soulbound items count only for this character">
                <Select.Trigger>
                    <Flex minW="0" alignItems="center" gap="2">
                        {selected?.icon && <IconImage icon={selected.icon} />}

                        <Select.ValueText
                            fontWeight="medium"
                            whiteSpace="nowrap"
                        />
                    </Flex>
                </Select.Trigger>

                <Select.IndicatorGroup>
                    <Select.Indicator />
                </Select.IndicatorGroup>
            </Select.Control>

            <Portal>
                <Select.Positioner>
                    <Select.Content>
                        {collection.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                                <Flex alignItems="center" gap="2">
                                    {item.icon && (
                                        <IconImage icon={item.icon} />
                                    )}

                                    <Select.ItemText>
                                        {item.label}
                                    </Select.ItemText>
                                </Flex>

                                <Select.ItemIndicator />
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Positioner>
            </Portal>
        </Select.Root>
    )
}
