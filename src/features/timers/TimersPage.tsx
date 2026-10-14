import { Container, Flex, Heading, Text } from "@chakra-ui/react"
import { getRouteApi } from "@tanstack/react-router"
import type { FieldBossRegion } from "@timers/config/fieldBosses"
import { TIMER_CATEGORIES, type TimerCategory } from "@timers/config/timers"
import { useEffect, useRef, useState } from "react"
import { useTimers } from "./hooks/useTimers"
import { ShowPinnedSwitch } from "./ShowPinnedSwitch"
import { PinnedLayout } from "./layout/PinnedLayout"
import { PinnedLayoutToggle } from "./layout/PinnedLayoutToggle"
import { useTabEdge } from "./layout/useTabEdge"
import { TimerTabs } from "./TimerTabs"

const route = getRouteApi("/timers")

export const TimersPage = () => {
    const search = route.useSearch()
    const navigate = route.useNavigate()
    const {
        now,
        timers,
        pinnedColumns,
        settings,
        togglePinned,
        changePinnedColumns,
        changeTimerColor,
        resetTimerColor,
        changeSoonMinutes,
        changeShowPinned,
        changeBossReport,
    } = useTimers()

    const [isLayoutOpen, setIsLayoutOpen] = useState(false)
    const layoutAreaRef = useRef<HTMLDivElement>(null)
    const layoutToggleRef = useRef<HTMLButtonElement>(null)
    const layoutTabEdge = useTabEdge(layoutToggleRef, layoutAreaRef)

    useEffect(() => {
        document.title = "Daevanion - Timers"
    }, [])

    // The timer to focus is a one-off request: the card handles it when it
    // renders, then it's dropped so the same link works again next time.
    useEffect(() => {
        if (search.timer) {
            navigate({
                search: (previous) => ({ ...previous, timer: undefined }),
                replace: true,
            })
        }
    }, [search.timer, navigate])

    const handleTabChange = (tab: TimerCategory) => {
        navigate({
            search: (previous) => ({ ...previous, tab: tab }),
            replace: true,
        })
    }

    const handleRegionChange = (region: FieldBossRegion) => {
        navigate({
            search: (previous) => ({ ...previous, region: region }),
            replace: true,
        })
    }

    const handleLayoutToggle = () => {
        setIsLayoutOpen(!isLayoutOpen)
    }

    return (
        <Container as="main" py={{ base: "4", md: "6" }} maxW="8xl" flex="1">
            <Flex flexDir="column" gap="5">
                {/* The layout editor opens under the heading row. */}
                <Flex ref={layoutAreaRef} flexDir="column">
                    <Flex
                        flexWrap="wrap"
                        alignItems="flex-end"
                        justifyContent="space-between"
                        gap="3"
                    >
                        {/* Room between the text and the open panel, which
                            meets the toggle with no gap. */}
                        <Flex flexDir="column" gap="1" pb="2">
                            <Heading size="lg">Timers</Heading>

                            <Text textStyle="hint">
                                EU servers. Times are reported by the community
                                and shown in your local time. Pin a timer to
                                keep it in the header on every page.
                            </Text>
                        </Flex>

                        <Flex flexWrap="wrap" alignItems="center" gap="3">
                            <ShowPinnedSwitch
                                checked={settings.showPinned}
                                onChange={changeShowPinned}
                            />

                            <PinnedLayoutToggle
                                ref={layoutToggleRef}
                                open={isLayoutOpen}
                                onToggle={handleLayoutToggle}
                            />
                        </Flex>
                    </Flex>

                    <PinnedLayout
                        columns={pinnedColumns}
                        now={now}
                        open={isLayoutOpen}
                        tabEdge={layoutTabEdge}
                        onChange={changePinnedColumns}
                    />
                </Flex>

                <TimerTabs
                    tab={search.tab ?? TIMER_CATEGORIES[0].id}
                    region={search.region ?? "verteron"}
                    focusedTimer={search.timer}
                    timers={timers}
                    now={now}
                    onTabChange={handleTabChange}
                    onRegionChange={handleRegionChange}
                    onTogglePinned={togglePinned}
                    onColorChange={changeTimerColor}
                    onColorReset={resetTimerColor}
                    onSoonMinutesChange={changeSoonMinutes}
                    onBossReportChange={changeBossReport}
                />
            </Flex>
        </Container>
    )
}
