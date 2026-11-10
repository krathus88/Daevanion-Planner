import { Button, Flex } from "@chakra-ui/react"
import { CardGrid } from "@common/CardGrid"
import type { ResetPeriods } from "@tracker/logic/resetPeriods"
import {
    getCardOwners,
    getServerGroups,
    getTaskGroups,
} from "@tracker/logic/trackerCards"
import type { TrackerCharacter, TrackerData, TrackerTask } from "@tracker/types"
import { LuChevronsDownUp, LuChevronsUpDown } from "react-icons/lu"
import { CharacterCard } from "./CharacterCard"
import { ResetCountdowns } from "./ResetCountdowns"
import { ServerCard } from "./ServerCard"
import type {
    CountChangeHandler,
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
    notes: TrackerData["notes"]
    membership: boolean
    minimized: string[]
    ignored: TrackerData["ignored"]
    periods: ResetPeriods
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onEnergyChange: EnergyChangeHandler
    onNoteChange: NoteChangeHandler
    onMinimizedChange: (owners: readonly string[], minimized: boolean) => void
    onIgnoredChange: IgnoredChangeHandler
}

// The server's shared tasks first, across the page (most players have one
// server); then a card per character.
export const TrackerBoard = ({
    characters,
    tasks,
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
                serverGroups.map((group) => (
                    <ServerCard
                        key={group.server}
                        group={group}
                        taskGroups={sharedGroups}
                        counts={counts}
                        entries={entries}
                        minimized={minimized}
                        ignored={ignored}
                        periods={periods}
                        onCountChange={onCountChange}
                        onEntriesChange={onEntriesChange}
                        onMinimizedChange={handleCardMinimized}
                        onIgnoredChange={onIgnoredChange}
                    />
                ))}

            {ownGroups.length > 0 && (
                <CardGrid title="Characters">
                    {characters.map((character) => (
                        <CharacterCard
                            key={character.id}
                            character={character}
                            taskGroups={ownGroups}
                            counts={counts}
                            entries={entries}
                            energy={energy}
                            notes={notes}
                            membership={membership}
                            minimized={minimized}
                            ignored={ignored}
                            periods={periods}
                            onCountChange={onCountChange}
                            onEntriesChange={onEntriesChange}
                            onEnergyChange={onEnergyChange}
                            onNoteChange={onNoteChange}
                            onMinimizedChange={handleCardMinimized}
                            onIgnoredChange={onIgnoredChange}
                        />
                    ))}
                </CardGrid>
            )}
        </Flex>
    )
}
