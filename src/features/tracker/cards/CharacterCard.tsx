import { Flex, Image, Text } from "@chakra-ui/react"
import { CLASS_ICONS, CLASS_NAMES } from "@config/classPresets/classInfo"
import { getServer } from "@timers/config/servers"
import { getCharacterLink } from "@tracker/logic/characterLink"
import { getCharacterName } from "@tracker/logic/characterName"
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
import { memo } from "react"
import { NoteButton } from "./NoteButton"
import { OdyleEnergyRow } from "./OdyleEnergyRow"
import { TaskCard } from "./TaskCard"
import type {
    CountChangeHandler,
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
    note?: CharacterNote
    // The account's membership: Odyle Energy's cap and cube cost.
    membership: boolean
    minimized: boolean
    // Whether its One-off box is open.
    goalsOpen: boolean
    ignored?: string[]
    periods: ResetPeriods
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onEnergyChange: EnergyChangeHandler
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
    note,
    membership,
    minimized,
    goalsOpen,
    ignored,
    periods,
    onCountChange,
    onEntriesChange,
    onEnergyChange,
    onNoteChange,
    onMinimizedChange,
    onIgnoredChange,
    onGoalsOpenChange,
}: CharacterCardProps) {
    const name = getCharacterName(character)
    const energyCap = getEnergyCap(membership)

    const handleEnergyChange = (left: EnergyLeft) => {
        onEnergyChange(character.id, periods.energy, left)
    }

    const handleNoteSave = (next: CharacterNote) => {
        onNoteChange(character.id, next)
    }

    return (
        <TaskCard
            title={name}
            owner={character.id}
            ownerLabel={name}
            taskGroups={taskGroups}
            periods={periods}
            counts={counts}
            entries={entries}
            ignored={ignored}
            minimized={minimized}
            goalsOpen={goalsOpen}
            titleHref={getCharacterLink(character) ?? undefined}
            // Odyle Energy, then the note's short line, above the task boxes.
            top={
                <Flex flexDir="column" gap="2">
                    <OdyleEnergyRow
                        left={readEnergy(energy, periods.energy, energyCap)}
                        cap={energyCap}
                        cubeCost={getCubeCost(membership)}
                        ownerLabel={name}
                        onChange={handleEnergyChange}
                    />

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
                <Image
                    src={CLASS_ICONS[character.classId]}
                    boxSize="8"
                    objectFit="contain"
                    alt=""
                    aria-hidden="true"
                />
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
    )
})
