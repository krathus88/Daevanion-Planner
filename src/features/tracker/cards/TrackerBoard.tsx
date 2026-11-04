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
    EntriesChangeHandler,
    IgnoredChangeHandler,
} from "./taskHandlers"

type TrackerBoardProps = {
    characters: TrackerCharacter[]
    tasks: readonly TrackerTask[]
    counts: TrackerData["counts"]
    entries: TrackerData["entries"]
    minimized: string[]
    ignored: TrackerData["ignored"]
    periods: ResetPeriods
    now: number
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
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
    minimized,
    ignored,
    periods,
    now,
    onCountChange,
    onEntriesChange,
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
                <ResetCountdowns now={now} />

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
                            minimized={minimized}
                            ignored={ignored}
                            periods={periods}
                            onCountChange={onCountChange}
                            onEntriesChange={onEntriesChange}
                            onMinimizedChange={handleCardMinimized}
                            onIgnoredChange={onIgnoredChange}
                        />
                    ))}
                </CardGrid>
            )}
        </Flex>
    )
}
