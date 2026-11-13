import { Box, Flex, Image, Text } from "@chakra-ui/react"
import { GlowDot } from "@common/GlowDot"
import { CLASS_ICONS, CLASS_NAMES } from "@config/classPresets/classInfo"
import { CUBE_KEYS_LOCK, ENERGY_LOCK } from "@account/game/companionLocks"
import { getServer } from "@timers/config/servers"
import {
    CorridorsUnknownContext,
    useIsLocked,
} from "@tracker/context/companionLocks"
import { getCharacterLink } from "@tracker/logic/characterLink"
import { getCharacterName } from "@tracker/logic/characterName"
import { withCorridorView } from "@tracker/logic/corridors"
import {
    getCubeCost,
    getEnergyCap,
    readEnergy,
    type EnergyLeft,
} from "@tracker/logic/odyleEnergy"
import type { ResetPeriods } from "@tracker/logic/resetPeriods"
import type { TaskGroup } from "@tracker/logic/trackerCards"
import type {
    CharacterNote,
    TaskCount,
    TaskEntries,
    TrackerCharacter,
} from "@tracker/types"
import { Tooltip } from "@ui/tooltip"
import { memo } from "react"
import { HiddenCubeKeysRow } from "./HiddenCubeKeysRow"
import { NoteButton } from "./NoteButton"
import { OdyleEnergyRow } from "./OdyleEnergyRow"
import { TaskCard } from "./TaskCard"
import type {
    CountChangeHandler,
    CubeKeysChangeHandler,
    EnergyChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
    NoteChangeHandler,
} from "./taskHandlers"

type CharacterCardProps = {
    character: TrackerCharacter
    taskGroups: TaskGroup[]
    // This character's own slices of the data, so other characters' edits
    // leave the props alone (see memo below).
    counts?: Record<string, TaskCount>
    entries?: Record<string, TaskEntries>
    energy?: TaskEntries
    cubeKeys?: number
    note?: CharacterNote
    // The account's membership: Odyle Energy's cap and cube cost.
    membership: boolean
    minimized: boolean
    // Whether its One-off box is open.
    goalsOpen: boolean
    ignored?: string[]
    // The companion app says this character is being played.
    playing?: boolean
    // How its Corridors task looks this siege (getCorridorView): the held
    // corridors (missing: as set up), and whether its entrances are unknown.
    corridors?: readonly string[] | null
    corridorsUnknown?: boolean
    periods: ResetPeriods
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onEnergyChange: EnergyChangeHandler
    onCubeKeysChange: CubeKeysChangeHandler
    onNoteChange: NoteChangeHandler
    onMinimizedChange: (owner: string, minimized: boolean) => void
    onIgnoredChange: IgnoredChangeHandler
    onGoalsOpenChange: (owner: string, open: boolean) => void
}

// memo: the board re-maps every card when one changes, and the compiler
// can't skip cards inside that map.
export const CharacterCard = memo(function CharacterCard({
    character,
    taskGroups,
    counts,
    entries,
    energy,
    cubeKeys,
    note,
    membership,
    minimized,
    goalsOpen,
    ignored,
    playing,
    corridors,
    corridorsUnknown = false,
    periods,
    onCountChange,
    onEntriesChange,
    onEnergyChange,
    onCubeKeysChange,
    onNoteChange,
    onMinimizedChange,
    onIgnoredChange,
    onGoalsOpenChange,
}: CharacterCardProps) {
    const name = getCharacterName(character)
    const energyLocked = useIsLocked(character.id, ENERGY_LOCK)
    const keysLocked = useIsLocked(character.id, CUBE_KEYS_LOCK)
    const energyCap = getEnergyCap(membership)
    const groups = withCorridorView(taskGroups, corridors)

    const handleEnergyChange = (left: EnergyLeft) => {
        onEnergyChange(character.id, periods.energy, left)
    }

    const handleCubeKeysChange = (count: number) => {
        onCubeKeysChange(character.id, count)
    }

    const handleNoteSave = (next: CharacterNote) => {
        onNoteChange(character.id, next)
    }

    return (
        <CorridorsUnknownContext value={corridorsUnknown}>
            <TaskCard
                title={name}
                owner={character.id}
                ownerLabel={name}
                taskGroups={groups}
                periods={periods}
                counts={counts}
                entries={entries}
                ignored={ignored}
                minimized={minimized}
                goalsOpen={goalsOpen}
                titleHref={getCharacterLink(character) ?? undefined}
                // Odyle Energy and Hidden Cube keys on one line, then the
                // note's short line, above the task boxes.
                top={
                    <Flex flexDir="column" gap="2">
                        <Flex
                            px="1"
                            flexWrap="wrap"
                            alignItems="center"
                            justifyContent="space-between"
                            columnGap="4"
                            rowGap="1"
                        >
                            <OdyleEnergyRow
                                left={readEnergy(
                                    energy,
                                    periods.energy,
                                    energyCap,
                                )}
                                cap={energyCap}
                                cubeCost={getCubeCost(membership)}
                                ownerLabel={name}
                                locked={energyLocked}
                                onChange={handleEnergyChange}
                            />

                            <HiddenCubeKeysRow
                                count={cubeKeys}
                                ownerLabel={name}
                                locked={keysLocked}
                                onChange={handleCubeKeysChange}
                            />
                        </Flex>

                        {note?.short && (
                            // On the task boxes' background, without their border.
                            <Text
                                px="3"
                                py="1.5"
                                bg="app.subcard"
                                borderRadius="md"
                                textStyle="hint"
                                whiteSpace="pre-wrap"
                            >
                                {note.short}
                            </Text>
                        )}
                    </Flex>
                }
                titleAction={
                    <NoteButton
                        ownerLabel={name}
                        note={note}
                        onSave={handleNoteSave}
                    />
                }
                icon={
                    <Box pos="relative" flexShrink="0">
                        <Image
                            src={CLASS_ICONS[character.classId]}
                            boxSize="8"
                            objectFit="contain"
                            alt=""
                            aria-hidden="true"
                        />

                        {playing && (
                            <Tooltip content="Playing now (companion app)">
                                <Box
                                    pos="absolute"
                                    top="-0.5"
                                    right="-0.5"
                                    aria-label="Playing now"
                                    role="img"
                                >
                                    <GlowDot tone="success" />
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                }
                subtitle={
                    <Text as="span" textStyle="caption">
                        {CLASS_NAMES[character.classId]} ·{" "}
                        {getServer(character.server).name}
                    </Text>
                }
                onCountChange={onCountChange}
                onEntriesChange={onEntriesChange}
                onMinimizedChange={onMinimizedChange}
                onIgnoredChange={onIgnoredChange}
                onGoalsOpenChange={onGoalsOpenChange}
            />
        </CorridorsUnknownContext>
    )
})
