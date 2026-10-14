import {
    chakra,
    Drawer,
    Flex,
    IconButton,
    Portal,
    type HTMLChakraProps,
} from "@chakra-ui/react"
import type { PlannerLocation } from "@planner/storage/plannerLocation"
import { Link as RouterLink } from "@tanstack/react-router"
import { useState } from "react"
import { LuMenu, LuX } from "react-icons/lu"
import { Brand } from "./Brand"
import { NavDrawerLink } from "./NavDrawerLink"
import type { SitePage } from "./sitePage"

type NavDrawerProps = HTMLChakraProps<"button"> & {
    currentPage: SitePage | null
    plannerLocation: PlannerLocation
}

// The site's pages on phones, behind a menu button. The brand next to the
// menu icon is part of the button, so tapping either opens it.
export const NavDrawer = ({
    currentPage,
    plannerLocation,
    ...props
}: NavDrawerProps) => {
    const [open, setOpen] = useState(false)

    const handleOpenChange = (details: Drawer.OpenChangeDetails) => {
        setOpen(details.open)
    }

    const handleNavigate = () => {
        setOpen(false)
    }

    return (
        <Drawer.Root
            size="xs"
            placement="start"
            open={open}
            onOpenChange={handleOpenChange}
        >
            <Drawer.Trigger asChild>
                <chakra.button
                    pe="2"
                    display="flex"
                    alignItems="center"
                    gap="1"
                    borderRadius="md"
                    textAlign="start"
                    cursor="button"
                    transitionProperty="common"
                    transitionDuration="fast"
                    _hover={{ bg: "app.hover" }}
                    aria-label="Open menu"
                    {...props}
                >
                    <Flex
                        boxSize="8"
                        flexShrink="0"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <LuMenu />
                    </Flex>

                    <Brand />
                </chakra.button>
            </Drawer.Trigger>

            <Portal>
                <Drawer.Backdrop />

                <Drawer.Positioner>
                    <Drawer.Content bg="app.panel">
                        <Drawer.Header
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Brand />

                            <Drawer.CloseTrigger asChild pos="static">
                                <IconButton
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Close menu"
                                >
                                    <LuX />
                                </IconButton>
                            </Drawer.CloseTrigger>
                        </Drawer.Header>

                        <Drawer.Body>
                            <Flex
                                as="nav"
                                flexDir="column"
                                gap="1"
                                aria-label="Site"
                            >
                                <NavDrawerLink
                                    isActive={currentPage === "planner"}
                                    onNavigate={handleNavigate}
                                >
                                    <RouterLink
                                        params={plannerLocation}
                                        to="/planner/$classId/$layout"
                                    >
                                        Planner
                                    </RouterLink>
                                </NavDrawerLink>

                                <NavDrawerLink
                                    isActive={currentPage === "timers"}
                                    onNavigate={handleNavigate}
                                >
                                    <RouterLink to="/timers">Timers</RouterLink>
                                </NavDrawerLink>
                            </Flex>
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    )
}
