import { Flex, HoverCard, Portal, Text } from "@chakra-ui/react"
import type { Pet } from "@pets/data/petAtlas"
import { LevelPicker } from "@pets/details/LevelPicker"
import { type MouseEvent, type ReactElement, useState } from "react"

// What hovering the pet shows: the level picker (a focused spot), just the
// pet's name and caption, or nothing. Right-click always shows the picker.
export type FarmPetHover = "picker" | "info" | "none"

type FarmPetLevelCardProps = {
    // The pet's button; it keeps opening the pet on click.
    children: ReactElement
    pet: Pet
    // Shown under the name, like a spot's spawns.
    caption: string
    // 0 is locked; 1-3 are Pet Insight levels.
    level: number
    hover: FarmPetHover
    placement?: "top" | "right"
    onLevelChange: (petId: number, level: number) => void
}

// Sets a pet's level on hover or right-click, without opening the pet.
// A pet set to Lv3 leaves a spot, and this card with it.
export const FarmPetLevelCard = ({
    children,
    pet,
    caption,
    level,
    hover,
    placement = "top",
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
        onLevelChange(pet.id, value)
    }

    const pickerShown = hover === "picker" || fromMenu

    return (
        <HoverCard.Root
            open={open}
            positioning={{ placement }}
            openDelay={hover === "info" ? 100 : 600}
            closeDelay={150}
            lazyMount
            unmountOnExit
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
                                    {pet.name}
                                </Text>

                                <Text textStyle="caption">{caption}</Text>
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
