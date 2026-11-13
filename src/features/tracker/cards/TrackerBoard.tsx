import { Button, Flex } from "@chakra-ui/react"
import { CardGrid } from "@common/CardGrid"
import { getCorridorView } from "@tracker/logic/corridors"
import type { ResetPeriods } from "@tracker/logic/resetPeriods"
import {
    getCardOwners,
    getServerGroups,
    getTaskGroups,
} from "@tracker/logic/trackerCards"
import { getServerOwner } from "@tracker/logic/taskOwners"
import type { TrackerCharacter, TrackerData, TrackerTask } from "@tracker/types"
import { LuChevronsDownUp, LuChevronsUpDown } from "react-icons/lu"
import { CharacterCard } from "./CharacterCard"
import { ResetCountdowns } from "./ResetCountdowns"
import { ServerCard } from "./ServerCard"
import type {
    CountChangeHandler,
    CubeKeysChangeHandler,
    EnergyChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
    NoteChangeHandler,
} from "./taskHandlers"

type TrackerBoardProps = {
    characters: TrackerCharacter[]
    tasks: readonly TrackerTask[]
    counts: TrackerData["counts"]
    entries: TrackerData["entries"]
    energy: TrackerData["energy"]
    cubeKeys: TrackerData["cubeKeys"]
    notes: TrackerData["notes"]
    membership: boolean
    minimized: string[]
    // Owners whose One-off box is open.
    goalsOpen: string[]
    ignored: TrackerData["ignored"]
    // Corridors each server's faction holds (the Corridors task's size).
    corridorHolds: TrackerData["corridorHolds"]
    // Corridor entrances each character has left (read since the siege?).
    corridorsLeft: TrackerData["corridorsLeft"]
    companionRunning: boolean
    periods: ResetPeriods
    // The character the companion app says is being played.
    playingId?: string
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onEnergyChange: EnergyChangeHandler
    onCubeKeysChange: CubeKeysChangeHandler
    onNoteChange: NoteChangeHandler
    onMinimizedChange: (owners: readonly string[], minimized: boolean) => void
    onIgnoredChange: IgnoredChangeHandler
    onGoalsOpenChange: (owner: string, open: boolean) => void
}

// The server's shared tasks first, across the page (most players have one
// server); then a card per character.
export const TrackerBoard = ({
    characters,
    tasks,
    counts,
    entries,
    energy,
    cubeKeys,
    notes,
    membership,
    minimized,
    goalsOpen,
    ignored,
    corridorHolds,
    corridorsLeft,
    companionRunning,
    periods,
    playingId,
    onCountChange,
    onEntriesChange,
    onEnergyChange,
    onCubeKeysChange,
    onNoteChange,
    onMinimizedChange,
    onIgnoredChange,
    onGoalsOpenChange,
}: TrackerBoardProps) => {
    const serverGroups = getServerGroups(characters)
    const sharedGroups = getTaskGroups(tasks, true)
    const ownGroups = getTaskGroups(tasks, false)
    const owners = getCardOwners(
        characters,
        sharedGroups.length > 0,
        ownGroups.length > 0,
    )
    const allMinimized = owners.every((owner) => minimized.includes(owner))

    const handleToggleAll = () => {
        onMinimizedChange(owners, !allMinimized)
    }

    const handleCardMinimized = (owner: string, next: boolean) => {
        onMinimizedChange([owner], next)
    }

    return (
        <Flex flexDir="column" gap="6">
            <Flex
                flexWrap="wrap"
                alignItems="center"
                justifyContent="space-between"
                gap="3"
            >
                <ResetCountdowns />

                <Button variant="ghost" size="sm" onClick={handleToggleAll}>
                    {allMinimized ? <LuChevronsUpDown /> : <LuChevronsDownUp />}
                    {allMinimized ? "Expand all" : "Minimize all"}
                </Button>
            </Flex>

            {sharedGroups.length > 0 &&
                serverGroups.map((group) => {
                    const owner = getServerOwner(group.server)

                    return (
                        <ServerCard
                            key={group.server}
                            group={group}
                            taskGroups={sharedGroups}
                            counts={counts[owner]}
                            entries={entries[owner]}
                            minimized={minimized.includes(owner)}
                            goalsOpen={goalsOpen.includes(owner)}
                            ignored={ignored[owner]}
                            periods={periods}
                            onCountChange={onCountChange}
                            onEntriesChange={onEntriesChange}
                            onMinimizedChange={handleCardMinimized}
                            onIgnoredChange={onIgnoredChange}
                            onGoalsOpenChange={onGoalsOpenChange}
                        />
                    )
                })}

            {ownGroups.length > 0 && (
                <CardGrid title="Characters">
                    {characters.map((character) => {
                        const corridors = getCorridorView(
                            corridorHolds[character.server],
                            corridorsLeft[character.id],
                            periods.siege,
                            companionRunning,
                        )

                        return (
                            <CharacterCard
                                key={character.id}
                                character={character}
                                taskGroups={ownGroups}
                                counts={counts[character.id]}
                                entries={entries[character.id]}
                                energy={energy[character.id]}
                                cubeKeys={cubeKeys[character.id]}
                                note={notes[character.id]}
                                membership={membership}
                                minimized={minimized.includes(character.id)}
                                goalsOpen={goalsOpen.includes(character.id)}
                                ignored={ignored[character.id]}
                                playing={character.id === playingId}
                                corridors={corridors?.artifacts}
                                corridorsUnknown={corridors?.unknown}
                                periods={periods}
                                onCountChange={onCountChange}
                                onEntriesChange={onEntriesChange}
                                onEnergyChange={onEnergyChange}
                                onCubeKeysChange={onCubeKeysChange}
                                onNoteChange={onNoteChange}
                                onMinimizedChange={handleCardMinimized}
                                onIgnoredChange={onIgnoredChange}
                                onGoalsOpenChange={onGoalsOpenChange}
                            />
                        )
                    })}
                </CardGrid>
            )}
        </Flex>
    )
}
