import { Checkbox, Flex, Icon, Image, Text } from "@chakra-ui/react"
import type { ImportChange } from "@pets/logic/screenshotImport"
import { PetIcon } from "@pets/PetIcon"
import { LuArrowRight, LuTriangleAlert } from "react-icons/lu"
import { ImportLevelLabel } from "./ImportLevelLabel"

type ImportChangeTileProps = {
    change: ImportChange
    checked: boolean
    onCheckedChange: (petId: number, checked: boolean) => void
}

// The card as read next to the pet it matched, so a wrong match is easy to
// spot and untick.
export const ImportChangeTile = ({
    change,
    checked,
    onCheckedChange,
}: ImportChangeTileProps) => {
    const handleCheckedChange = (details: Checkbox.CheckedChangeDetails) => {
        onCheckedChange(change.pet.id, details.checked === true)
    }

    return (
        <Checkbox.Root
            pos="relative"
            p="2"
            minW="0"
            flexDir="column"
            alignItems="stretch"
            gap="1.5"
            layerStyle={checked ? "listItemActive" : "listItem"}
            bg={checked ? undefined : "app.row"}
            cursor="button"
            _hover={
                checked
                    ? undefined
                    : { bg: "app.hover", borderColor: "app.borderStrong" }
            }
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

                    <Flex alignItems="center" gap="1.5">
                        <ImportLevelLabel level={change.current} />

                        <Icon boxSize="3" color="app.subtle">
                            <LuArrowRight />
                        </Icon>

                        <ImportLevelLabel level={change.level} />
                    </Flex>

                    {change.unsure && (
                        <Flex
                            alignItems="center"
                            gap="1"
                            color="app.accent"
                            fontSize="xs"
                        >
                            <Icon boxSize="3">
                                <LuTriangleAlert />
                            </Icon>
                            Check the match
                        </Flex>
                    )}
                </Flex>
            </Checkbox.Label>
        </Checkbox.Root>
    )
}
