import {
    Box,
    Container,
    Flex,
    Link,
    NativeSelect,
    Text,
} from "@chakra-ui/react"
import { useEffect } from "react"
import { Link as RouterLink, useNavigate } from "@tanstack/react-router"
import { DaevanionBoard } from "@components/daevanion-board/components/DaevanionBoard"
import {
    layouts,
    type LayoutType,
} from "@components/daevanion-board/config/layouts"
import { classPresets } from "@config/classPresets"

type DaevanionProps = {
    classId: string
    layout: LayoutType
}

export const Daevanion = ({ classId, layout }: DaevanionProps) => {
    const navigate = useNavigate()
    const selectedClass = classPresets[classId]

    // Show the selected class's emblem as the favicon.
    useEffect(() => {
        const favicon =
            document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (!favicon) {
            return
        }

        favicon.type = selectedClass.icon ? "image/webp" : "image/svg+xml"
        favicon.href = selectedClass.icon ?? "/favicon.svg"
    }, [selectedClass.icon])

    useEffect(() => {
        document.title = `Daevanion - ${selectedClass.name}`
    }, [selectedClass.name])

    return (
        <Box minH="100vh">
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
                        <Flex alignItems="baseline" gap="2" flexShrink="0">
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
                            <Text asChild color="app.muted" fontSize="sm">
                                <label htmlFor="class-select">Class</label>
                            </Text>
                            <NativeSelect.Root size="sm" width="40">
                                <NativeSelect.Field
                                    background="app.raised"
                                    borderColor="app.borderStrong"
                                    color="app.fg"
                                    fontWeight="medium"
                                    id="class-select"
                                    onChange={(event) =>
                                        navigate({
                                            to: "/$classId/$layout",
                                            params: {
                                                classId: event.target.value,
                                                layout,
                                            },
                                            resetScroll: false,
                                        })
                                    }
                                    value={classId}
                                    _focusVisible={{
                                        borderColor: "app.accent",
                                        outline: "1px solid",
                                        outlineColor: "app.accent",
                                    }}
                                >
                                    {Object.values(classPresets).map(
                                        (preset) => (
                                            <option
                                                key={preset.id}
                                                value={preset.id}
                                                style={{
                                                    background: "#1c2230",
                                                }}
                                            >
                                                {preset.name}
                                            </option>
                                        ),
                                    )}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator color="app.muted" />
                            </NativeSelect.Root>
                        </Flex>
                    </Flex>
                </Container>
            </Box>

            <Container as="main" maxW="8xl" py={{ base: "4", md: "6" }}>
                <DaevanionBoard classPreset={selectedClass} layout={layout} />
            </Container>
        </Box>
    )
}
