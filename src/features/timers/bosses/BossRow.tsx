import {
    Button,
    Collapsible,
    Flex,
    Grid,
    Icon,
    IconButton,
    Text,
    useRecipe,
    type SystemStyleObject,
} from "@chakra-ui/react"
import type { FieldBoss, FieldBossId } from "@timers/config/fieldBosses"
import {
    BOSS_ALIVE_FOR,
    type TimerColor,
    type TimerId,
} from "@timers/config/timers"
import type { TimerEntry } from "@timers/hooks/useTimers"
import { formatDuration } from "@timers/logic/formatTime"
import type { BossReport } from "@timers/storage/timerSettings"
import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { LuChevronDown } from "react-icons/lu"
import { ComingNextButton } from "@timers/card/ComingNextButton"
import { PinButton } from "@timers/card/PinButton"
import { TimerCustomise } from "@timers/card/TimerCustomise"
import { BossNotes } from "./BossNotes"
import { BossReportForm } from "./BossReportForm"
import { BossStatus } from "./BossStatus"

// Loot tables are large, so they load on first open.
const BossLoot = lazy(async () => {
    const module = await import("./BossLoot")

    return { default: module.BossLoot }
})

type BossRowProps = {
    entry: TimerEntry
    boss: FieldBoss
    now: number
    focused: boolean
    onTogglePinned: (id: TimerId) => void
    onColorChange: (id: TimerId, color: TimerColor) => void
    onColorReset: (id: TimerId) => void
    onSoonMinutesChange: (id: TimerId, minutes: number) => void
    onReportChange: (id: TimerId, report: BossReport | null) => void
}

export const BossRow = ({
    entry,
    boss,
    now,
    focused,
    onTogglePinned,
    onColorChange,
    onColorReset,
    onSoonMinutesChange,
    onReportChange,
}: BossRowProps) => {
    const highlight = useRecipe({ key: "timerHighlight" })

    const [open, setOpen] = useState(focused)
    const [lastFocused, setLastFocused] = useState(focused)
    // Outlasts the focus request: the form only mounts once the row is open.
    const [focusForm, setFocusForm] = useState(focused)
    const rowRef = useRef<HTMLDivElement>(null)
    const killedRef = useRef<HTMLButtonElement>(null)

    if (focused !== lastFocused) {
        setLastFocused(focused)

        if (focused) {
            setOpen(true)
            setFocusForm(true)
        }
    }

    useEffect(() => {
        if (!focused) {
            return
        }

        rowRef.current?.scrollIntoView({ block: "center" })

        if (boss.respawn === null) {
            killedRef.current?.focus()
        }
    }, [focused, boss.respawn])

    const id = entry.timer.id
    const highlightStyles: SystemStyleObject = highlight({
        state: entry.alert,
        tone: entry.color.tone,
        plain: !entry.pinned,
    })

    const handleKilled = () => {
        const killedAt = Date.now()

        onReportChange(
            id,
            boss.respawn === null
                ? { killedAt: killedAt }
                : { spawnAt: killedAt + boss.respawn, reportedAt: killedAt },
        )
    }

    const handleReport = (report: BossReport) => {
        onReportChange(id, report)
        setOpen(false)
        setFocusForm(false)
    }

    const handleClear = () => {
        onReportChange(id, null)
    }

    const handleToggle = () => {
        setOpen(!open)
        setFocusForm(false)
    }

    return (
        <Flex
            ref={rowRef}
            colorPalette={entry.color.hue}
            flexDir="column"
            borderRadius="lg"
            css={highlightStyles}
        >
            <Grid
                px="3"
                py="2"
                templateAreas={`"name pin" "actions actions"`}
                templateColumns="minmax(0, 1fr) auto"
                alignItems="center"
                columnGap="3"
                rowGap="1"
            >
                <Flex gridArea="name" minW="0" flexDir="column">
                    <Flex alignItems="baseline" gap="2">
                        <Text fontSize="sm" fontWeight="semibold" truncate>
                            {boss.name}
                        </Text>

                        {boss.level && (
                            <Text flexShrink="0" textStyle="caption">
                                Lv {boss.level}
                            </Text>
                        )}
                    </Flex>

                    <Text textStyle="caption" truncate>
                        {boss.zone}
                        {" · "}
                        {boss.respawn === null
                            ? boss.note
                            : `Respawn ${formatDuration(boss.respawn)}`}
                    </Text>
                </Flex>

                <Flex
                    gridArea="actions"
                    justifySelf="end"
                    alignItems="center"
                    gap="2"
                >
                    <BossStatus state={entry.state} now={now} />

                    <Button
                        ref={killedRef}
                        variant="secondary"
                        size="xs"
                        title={`${boss.name} was killed just now`}
                        onClick={handleKilled}
                    >
                        Killed
                    </Button>

                    <IconButton
                        variant="ghost"
                        size="xs"
                        aria-label={
                            open
                                ? `Close ${boss.name}'s options`
                                : `Show ${boss.name}'s loot, timer and colours`
                        }
                        aria-expanded={open}
                        onClick={handleToggle}
                    >
                        <Icon
                            transform={open ? "rotate(180deg)" : undefined}
                            transitionProperty="transform"
                            transitionDuration="fast"
                        >
                            <LuChevronDown />
                        </Icon>
                    </IconButton>
                </Flex>

                <Flex gridArea="pin" gap="1">
                    <ComingNextButton
                        id={id}
                        included={entry.inComingNext}
                        name={boss.name}
                    />

                    <PinButton
                        id={id}
                        pinned={entry.pinned}
                        name={boss.name}
                        onToggle={onTogglePinned}
                    />
                </Flex>
            </Grid>

            {/* Mounted only while open: 50 hidden forms add up. */}
            <Collapsible.Root open={open} lazyMount unmountOnExit>
                <Collapsible.Content>
                    <Flex
                        px="3"
                        pt="3"
                        pb="2"
                        flexDir="column"
                        gap="3"
                        borderTopWidth="1px"
                        borderColor="app.border"
                    >
                        <BossNotes
                            name={boss.shortName}
                            aliveFor={boss.aliveFor ?? BOSS_ALIVE_FOR}
                            state={entry.state}
                        />

                        {!boss.schedule && (
                            <BossReportForm
                                focusRequest={focusForm}
                                onChange={handleReport}
                                onClear={
                                    entry.canClearReport
                                        ? handleClear
                                        : undefined
                                }
                            />
                        )}

                        {boss.schedule && entry.canClearReport && (
                            <Button
                                variant="dangerGhost"
                                size="xs"
                                alignSelf="flex-start"
                                onClick={handleClear}
                            >
                                Clear timer
                            </Button>
                        )}

                        <Suspense
                            fallback={
                                <Text textStyle="hint">Loading loot�</Text>
                            }
                        >
                            <BossLoot bossId={boss.id as FieldBossId} />
                        </Suspense>

                        <TimerCustomise
                            id={id}
                            color={entry.color}
                            hasCustomColor={entry.hasCustomColor}
                            soonMinutes={entry.soonMinutes}
                            onColorChange={onColorChange}
                            onColorReset={onColorReset}
                            onSoonMinutesChange={onSoonMinutesChange}
                        />
                    </Flex>
                </Collapsible.Content>
            </Collapsible.Root>
        </Flex>
    )
}
