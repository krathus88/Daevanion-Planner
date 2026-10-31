import { Checkbox, Flex, Icon, Image, Text } from "@chakra-ui/react"
import { levelFromSouls } from "@pets/logic/petLevels"
import type { ImportChange } from "@pets/logic/screenshotImport"
import { PetIcon } from "@pets/PetIcon"
import { LuArrowRight, LuTriangleAlert } from "react-icons/lu"
import { ImportLevelLabel } from "./ImportLevelLabel"
import { ImportSoulsEditor } from "./ImportSoulsEditor"

type ImportChangeTileProps = {
    change: ImportChange
    // Total souls that will be saved: as read, or as corrected here.
    souls: number
    checked: boolean
    onCheckedChange: (petId: number, checked: boolean) => void
    onSoulsChange: (petId: number, souls: number) => void
}

// The card as read next to the pet it matched, so a wrong match is easy to
// spot and untick, and a wrong value to correct. The editor stays outside the
// checkbox, whose label would toggle on every click inside it.
export const ImportChangeTile = ({
    change,
    souls,
    checked,
    onCheckedChange,
    onSoulsChange,
}: ImportChangeTileProps) => {
    const handleCheckedChange = (details: Checkbox.CheckedChangeDetails) => {
        onCheckedChange(change.pet.id, details.checked === true)
    }

    const handleSoulsChange = (value: number) => {
        onSoulsChange(change.pet.id, value)
    }

    return (
        <Flex
            pos="relative"
            p="2"
            minW="0"
            flexDir="column"
            gap="2"
            layerStyle={checked ? "listItemActive" : "listItem"}
            bg={checked ? undefined : "app.row"}
            _hover={
                checked
                    ? undefined
                    : { bg: "app.hover", borderColor: "app.borderStrong" }
            }
        >
            <Checkbox.Root
                minW="0"
                flexDir="column"
                alignItems="stretch"
                gap="1.5"
                cursor="button"
                checked={checked}
                onCheckedChange={handleCheckedChange}
            >
                <Checkbox.HiddenInput />

                <Checkbox.Control
                    pos="absolute"
                    top="2"
                    right="2"
                    borderColor="app.borderStrong"
                    _checked={{
                        bg: "app.accent",
                        borderColor: "app.accent",
                        color: "app.accentFg",
                    }}
                />

                <Flex alignItems="center" gap="1.5">
                    <Image
                        src={change.thumbnail}
                        w="9"
                        h="12"
                        flexShrink="0"
                        objectFit="cover"
                        borderRadius="sm"
                        alt=""
                        aria-hidden="true"
                    />

                    <PetIcon pet={change.pet} />
                </Flex>

                <Checkbox.Label minW="0" fontWeight="normal">
                    <Flex flexDir="column" gap="1">
                        <Text fontSize="sm" fontWeight="medium" truncate>
                            {change.pet.name}
                        </Text>

                        <Flex flexWrap="wrap" alignItems="center" gap="1.5">
                            <ImportLevelLabel
                                level={change.current}
                                souls={change.currentSouls}
                            />

                            <Icon boxSize="3" color="app.subtle">
                                <LuArrowRight />
                            </Icon>

                            <ImportLevelLabel
                                level={levelFromSouls(souls)}
                                souls={souls}
                            />
                        </Flex>

                        {(change.unsure || change.soulsUnsure) && (
                            <Flex
                                alignItems="center"
                                gap="1"
                                color="app.accent"
                                fontSize="xs"
                            >
                                <Icon boxSize="3">
                                    <LuTriangleAlert />
                                </Icon>
                                {change.unsure
                                    ? "Check the match"
                                    : "Check the souls"}
                            </Flex>
                        )}
                    </Flex>
                </Checkbox.Label>
            </Checkbox.Root>

            <ImportSoulsEditor souls={souls} onChange={handleSoulsChange} />
        </Flex>
    )
}
