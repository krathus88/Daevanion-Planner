import { Flex, Image, Text } from "@chakra-ui/react"
import { CLASS_ICONS, CLASS_NAMES } from "@config/classPresets/classInfo"
import { getServer } from "@timers/config/servers"
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
    TrackerCharacter,
    TrackerData,
} from "@tracker/types"
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
    counts: TrackerData["counts"]
    entries: TrackerData["entries"]
    energy: TrackerData["energy"]
    notes: TrackerData["notes"]
    // The account's membership: Odyle Energy's cap and cube cost.
    membership: boolean
    minimized: string[]
    ignored: TrackerData["ignored"]
    periods: ResetPeriods
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onEnergyChange: EnergyChangeHandler
    onNoteChange: NoteChangeHandler
    onMinimizedChange: (owner: string, minimized: boolean) => void
    onIgnoredChange: IgnoredChangeHandler
}

export const CharacterCard = ({
    character,
    taskGroups,
    counts,
    entries,
    energy,
    notes,
    membership,
    minimized,
    ignored,
    periods,
    onCountChange,
    onEntriesChange,
    onEnergyChange,
    onNoteChange,
    onMinimizedChange,
    onIgnoredChange,
}: CharacterCardProps) => {
    const name = getCharacterName(character)
    const energyCap = getEnergyCap(membership)

    const handleEnergyChange = (left: EnergyLeft) => {
        onEnergyChange(character.id, periods.energy, left)
    }

    const handleNoteSave = (next: CharacterNote) => {
        onNoteChange(character.id, next)
    }

    const note = notes[character.id]

    return (
        <TaskCard
            title={name}
            owner={character.id}
            ownerLabel={name}
            taskGroups={taskGroups}
            periods={periods}
            counts={counts[character.id]}
            entries={entries[character.id]}
            ignored={ignored[character.id]}
            minimized={minimized.includes(character.id)}
            // Odyle Energy, then the note's short line, above the task boxes.
            top={
                <Flex flexDir="column" gap="2">
                    <OdyleEnergyRow
                        left={readEnergy(
                            energy[character.id],
                            periods.energy,
                            energyCap,
                        )}
                        cap={energyCap}
                        cubeCost={getCubeCost(membership)}
                        ownerLabel={name}
                        onChange={handleEnergyChange}
                    />

                    {note?.short && (
                        <Text px="1" textStyle="hint" whiteSpace="pre-wrap">
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
        />
    )
}
