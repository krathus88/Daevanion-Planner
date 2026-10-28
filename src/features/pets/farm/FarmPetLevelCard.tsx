import { Flex, HoverCard, Portal, Text } from "@chakra-ui/react"
import { LevelPicker } from "@pets/details/LevelPicker"
import type { FarmSpotPet } from "@pets/logic/farmSpots"
import { type MouseEvent, type ReactElement, useState } from "react"

// What hovering the pet shows: the level picker (a focused spot), just the
// pet's name and spawns, or nothing. Right-click always shows the picker.
export type FarmPetHover = "picker" | "info" | "none"

type FarmPetLevelCardProps = {
    // The pet's button; it keeps opening the pet on click.
    children: ReactElement
    entry: FarmSpotPet
    // 0 is locked; 1-3 are Pet Insight levels.
    level: number
    hover: FarmPetHover
    onLevelChange: (petId: number, level: number) => void
}

// Sets a spot's pet level on hover or right-click, without opening the pet.
// A pet set to Lv3 leaves the spot, and this card with it.
export const FarmPetLevelCard = ({
    children,
    entry,
    level,
    hover,
    onLevelChange,
}: FarmPetLevelCardProps) => {
    const [open, setOpen] = useState(false)
    const [fromMenu, setFromMenu] = useState(false)

    const handleOpenChange = (details: HoverCard.OpenChangeDetails) => {
        if (details.open && hover === "none") {
            return
        }

        setOpen(details.open)

        if (!details.open) {
            setFromMenu(false)
        }
    }

    const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault()
        setFromMenu(true)
        setOpen(true)
    }

    const handleLevelChange = (value: number) => {
        onLevelChange(entry.pet.id, value)
    }

    const pickerShown = hover === "picker" || fromMenu

    return (
        <HoverCard.Root
            open={open}
            positioning={{ placement: "top" }}
            openDelay={hover === "info" ? 100 : 600}
            closeDelay={150}
            onOpenChange={handleOpenChange}
        >
            <HoverCard.Trigger asChild onContextMenu={handleContextMenu}>
                {children}
            </HoverCard.Trigger>

            <Portal>
                <HoverCard.Positioner zIndex="popover">
                    <HoverCard.Content p="3">
                        <HoverCard.Arrow>
                            <HoverCard.ArrowTip />
                        </HoverCard.Arrow>

                        <Flex flexDir="column" gap="2">
                            <Flex flexDir="column">
                                <Text fontSize="sm" fontWeight="semibold">
                                    {entry.pet.name}
                                </Text>

                                <Text textStyle="caption">
                                    {entry.spawns} spawns in this spot
                                </Text>
                            </Flex>

                            {pickerShown && (
                                <LevelPicker
                                    value={level}
                                    onChange={handleLevelChange}
                                />
                            )}
                        </Flex>
                    </HoverCard.Content>
                </HoverCard.Positioner>
            </Portal>
        </HoverCard.Root>
    )
}
