import { Box, Container, Flex } from "@chakra-ui/react"
import { ClassSelect } from "@planner/ClassSelect"
import { usePlannerLocation } from "@planner/hooks/usePlannerLocation"
import { useMatch } from "@tanstack/react-router"
import { PinnedTimers } from "@timers/pinned/PinnedTimers"
import { PinnedToggleButton } from "@timers/pinned/PinnedToggleButton"
import { Brand } from "./Brand"
import { NavDrawer } from "./NavDrawer"
import { PageNav } from "./PageNav"

// Phones: menu, brand and class, then pinned timers.
// Tablets: brand, pages and class, then pinned timers.
// Desktop: one row. The board tabs live in the planner's sidebar, with the
// rest of the board's controls.
export const Header = () => {
    const plannerMatch = useMatch({
        from: "/planner/$classId/$layout",
        shouldThrow: false,
    })
    const timersMatch = useMatch({ from: "/timers", shouldThrow: false })
    const plannerLocation = usePlannerLocation()

    const plannerParams = plannerMatch?.params
    const currentPage = plannerMatch ? "planner" : timersMatch ? "timers" : null

    return (
        <Box
            as="header"
            // Hovering the header reveals controls inside it (_groupHover).
            className="group"
            pos="sticky"
            top="0"
            zIndex="sticky"
            bg="app.header"
            borderColor="app.border"
            borderBottomWidth="1px"
            backdropFilter="blur(10px)"
        >
            <Container maxW="8xl">
                <Flex
                    py={{ base: "2", xl: "0" }}
                    minH="16"
                    flexWrap={{ base: "wrap", xl: "nowrap" }}
                    alignItems="center"
                    rowGap="2"
                    columnGap={{ base: "2", md: "6" }}
                >
                    {/* On phones the brand is part of the menu button. */}
                    <NavDrawer
                        currentPage={currentPage}
                        plannerLocation={plannerParams ?? plannerLocation}
                        hideFrom="md"
                    />

                    <Brand hideBelow="md" />

                    <PageNav
                        currentPage={currentPage}
                        plannerLocation={plannerParams ?? plannerLocation}
                        mr={{ xl: "auto" }}
                        hideBelow="md"
                    />

                    {/* One evenly spaced group on desktop. Below that it
                        dissolves, so its parts can take their own rows. */}
                    <Flex
                        minW="0"
                        order={{ xl: 2 }}
                        display={{ base: "contents", xl: "flex" }}
                        alignItems="center"
                        gap="2"
                    >
                        <PinnedTimers
                            w={{ base: "full", xl: "auto" }}
                            order={{ base: 4, xl: 2 }}
                        />

                        <Flex
                            ml={{ base: "auto", xl: "0" }}
                            flexShrink="0"
                            order="3"
                            alignItems="center"
                            gap="2"
                        >
                            <PinnedToggleButton />

                            <ClassSelect
                                classId={
                                    plannerParams?.classId ??
                                    plannerLocation.classId
                                }
                                layout={plannerParams?.layout}
                            />
                        </Flex>
                    </Flex>
                </Flex>
            </Container>
        </Box>
    )
}
