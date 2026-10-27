import { AccountSection } from "@account/AccountSection"
import { useAuth } from "@account/hooks/useAuth"
import {
    chakra,
    Drawer,
    Flex,
    IconButton,
    Portal,
    useBreakpointValue,
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

export const NavDrawer = ({
    currentPage,
    plannerLocation,
    ...props
}: NavDrawerProps) => {
    const auth = useAuth()
    const isPhone =
        useBreakpointValue({ base: true, md: false }, { ssr: false }) ?? false
    const [open, setOpen] = useState(false)
    const [shownRefusal, setShownRefusal] = useState(false)

    const loginRefused = auth.status === "signedOut" && auth.error !== null

    // Opens by itself on phones to say why a Discord login was refused.
    if (loginRefused && isPhone && !shownRefusal) {
        setShownRefusal(true)
        setOpen(true)
    }

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

                                <NavDrawerLink
                                    isActive={currentPage === "pets"}
                                    onNavigate={handleNavigate}
                                >
                                    <RouterLink to="/pets">Pets</RouterLink>
                                </NavDrawerLink>
                            </Flex>
                        </Drawer.Body>

                        <Drawer.Footer
                            pt="4"
                            borderColor="app.border"
                            borderTopWidth="1px"
                        >
                            <AccountSection />
                        </Drawer.Footer>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    )
}
