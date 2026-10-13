import { Box, Container, Flex, Link, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { Link as RouterLink, useNavigate } from "@tanstack/react-router"
import { Footer } from "@layout/Footer"
import { ClassSelect } from "./ClassSelect"
import { DaevanionBoard } from "@components/daevanion-board/components/DaevanionBoard"
import type {
    BoardView,
    SidebarTab,
} from "@components/daevanion-board/components/BoardWorkspace"
import {
    layouts,
    type LayoutType,
} from "@components/daevanion-board/config/layouts"
import { classPresets } from "@config/classPresets"

type DaevanionProps = {
    classId: string
    layout: LayoutType
    boardView: BoardView
    onBoardViewChange: (view: BoardView) => void
}

export const Daevanion = ({
    classId,
    layout,
    boardView,
    onBoardViewChange,
}: DaevanionProps) => {
    const navigate = useNavigate()
    // Lives here, above the per-board state, so switching board keeps the
    // sidebar tab. The page is keyed by class, so a new class starts on Plan.
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>("plan")
    const selectedClass = classPresets[classId]

    // Show the selected class's emblem as the favicon.
    useEffect(() => {
        const favicon =
            document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (!favicon) {
            return
        }

        favicon.type = selectedClass.icon ? "image/webp" : "image/svg+xml"
        favicon.href =
            selectedClass.icon ?? `${import.meta.env.BASE_URL}favicon.svg`
    }, [selectedClass.icon])

    useEffect(() => {
        document.title = `Daevanion - ${selectedClass.name}`
    }, [selectedClass.name])

    return (
        <Flex direction="column" minH="100vh">
            <Box
                as="header"
                backdropFilter="blur(10px)"
                background="rgba(20, 24, 33, 0.9)"
                borderBottomWidth="1px"
                borderColor="app.border"
                position="sticky"
                top="0"
                zIndex="sticky"
            >
                <Container maxW="8xl">
                    <Flex
                        alignItems="center"
                        columnGap={{ base: "4", md: "8" }}
                        minH="16"
                        rowGap="2"
                        py={{ base: "2", md: "0" }}
                        wrap="wrap"
                    >
                        {/* Two lines on phones so the class picker fits
                            beside it; one line from md up. */}
                        <Flex
                            alignItems={{ base: "flex-start", md: "baseline" }}
                            columnGap="2"
                            direction={{ base: "column", md: "row" }}
                            flexShrink="0"
                            lineHeight={{ base: "1.15", md: "normal" }}
                        >
                            <Text
                                color="app.accent"
                                fontSize="lg"
                                fontWeight="bold"
                                letterSpacing="tight"
                            >
                                Daevanion
                            </Text>
                            <Text color="app.muted" fontSize="lg">
                                Planner
                            </Text>
                        </Flex>

                        <Flex
                            aria-label="Select board"
                            as="nav"
                            alignSelf="stretch"
                            gap="1"
                            minWidth="0"
                            order={{ base: 3, md: 2 }}
                            overflowX="auto"
                            width={{ base: "100%", md: "auto" }}
                        >
                            {(Object.keys(layouts) as LayoutType[]).map(
                                (layoutName) => {
                                    const isActive = layoutName === layout

                                    return (
                                        <Link
                                            alignItems="center"
                                            asChild
                                            borderBottomColor={
                                                isActive
                                                    ? "app.accent"
                                                    : "transparent"
                                            }
                                            borderBottomWidth="2px"
                                            color={
                                                isActive
                                                    ? "app.fg"
                                                    : "app.muted"
                                            }
                                            display="flex"
                                            fontSize="sm"
                                            fontWeight={
                                                isActive ? "semibold" : "medium"
                                            }
                                            key={layoutName}
                                            minH={{ base: "10", md: "16" }}
                                            px="4"
                                            textDecoration="none"
                                            textTransform="capitalize"
                                            whiteSpace="nowrap"
                                            _hover={{
                                                color: "app.fg",
                                                textDecoration: "none",
                                                background: "app.raised",
                                            }}
                                        >
                                            <RouterLink
                                                to="/$classId/$layout"
                                                params={{
                                                    classId,
                                                    layout: layoutName,
                                                }}
                                                resetScroll={false}
                                                aria-current={
                                                    isActive
                                                        ? "page"
                                                        : undefined
                                                }
                                            >
                                                {layoutName}
                                            </RouterLink>
                                        </Link>
                                    )
                                },
                            )}
                        </Flex>

                        <Flex
                            alignItems="center"
                            gap="2"
                            marginLeft="auto"
                            order={{ base: 2, md: 3 }}
                        >
                            <ClassSelect
                                classId={classId}
                                onChange={(nextClassId) =>
                                    navigate({
                                        to: "/$classId/$layout",
                                        params: {
                                            classId: nextClassId,
                                            layout,
                                        },
                                        resetScroll: false,
                                    })
                                }
                            />
                        </Flex>
                    </Flex>
                </Container>
            </Box>

            <Container
                as="main"
                flex="1"
                maxW="8xl"
                py={{ base: "4", md: "6" }}
            >
                <DaevanionBoard
                    classPreset={selectedClass}
                    layout={layout}
                    onSidebarTabChange={setSidebarTab}
                    onViewChange={onBoardViewChange}
                    sidebarTab={sidebarTab}
                    view={boardView}
                />
            </Container>

            <Footer />
        </Flex>
    )
}
