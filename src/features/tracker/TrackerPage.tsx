import { CompanionNote } from "@account/CompanionNote"
import { findPlayingId } from "@account/game/playingCharacter"
import { useCompanionStatus } from "@account/hooks/useCompanionStatus"
import { Button, Container, Flex, Heading, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { LuListChecks, LuUsers } from "react-icons/lu"
import { TrackerBoard } from "./cards/TrackerBoard"
import {
    ArenaUnknownContext,
    CompanionLocksContext,
} from "./context/companionLocks"
import { useNewGameCharacters } from "./hooks/useNewGameCharacters"
import { isArenaWeekUnknown } from "./logic/arenaWeeks"
import { useCompanionLocks } from "./hooks/useCompanionLocks"
import { useResetPeriods } from "./hooks/useResetPeriods"
import { useTrackerData } from "./hooks/useTrackerData"
import { getTaskSections } from "./logic/taskSections"
import { CharactersDialog } from "./manage/CharactersDialog"
import { TasksDialog } from "./manage/TasksDialog"
import { NewCharacterDialog } from "./NewCharacterDialog"
import { NoCharacters } from "./NoCharacters"

export const TrackerPage = () => {
    const periods = useResetPeriods()
    const companion = useCompanionStatus()
    const {
        characters,
        tasks,
        energy,
        cubeKeys,
        arena,
        corridorHolds,
        declined,
        notes,
        membership,
        counts,
        entries,
        minimized,
        goalsOpen,
        ignored,
        usesStarterTasks,
        removedPresets,
        changeCount,
        confirmArena,
        addGameCharacter,
        declineCharacter,
        changeEntries,
        changeMinimized,
        changeMembership,
        changeEnergy,
        changeCubeKeys,
        changeNote,
        changeIgnored,
        changeGoalsOpen,
        createCharacter,
        changeCharacter,
        deleteCharacter,
        shiftCharacter,
        createTask,
        changeTask,
        deleteTask,
        shiftTask,
        restoreTasks,
        addPresetBack,
    } = useTrackerData()

    const locks = useCompanionLocks(
        companion,
        characters,
        tasks,
        arena,
        periods.weekly,
    )
    const newCharacters = useNewGameCharacters(characters, declined)
    const arenaUnknown = new Set(
        characters
            .filter((character) => {
                return isArenaWeekUnknown(arena[character.id], periods.weekly)
            })
            .map((character) => character.id),
    )
    const [charactersOpen, setCharactersOpen] = useState(false)
    const [tasksOpen, setTasksOpen] = useState(false)

    useEffect(() => {
        document.title = "Daevanion - Tracker"
    }, [])

    const handleOpenCharacters = () => {
        setCharactersOpen(true)
    }

    const handleOpenTasks = () => {
        setTasksOpen(true)
    }

    const sections = getTaskSections(tasks)

    return (
        <Container as="main" py={{ base: "4", md: "6" }} maxW="8xl" flex="1">
            <Flex flexDir="column" gap="5">
                <Flex
                    flexWrap="wrap"
                    alignItems="flex-end"
                    justifyContent="space-between"
                    gap="3"
                >
                    <Flex flexDir="column" gap="1">
                        <Heading size="lg">Tracker</Heading>

                        <Text textStyle="hint">
                            Dailies and weeklies per character, and per server
                            for shared ones. Counts clear at the daily reset
                            (07:00 UTC), the weekly one (Wednesday 07:00 UTC) or
                            each Artifact Siege; one-off goals never clear.
                            Odyle Energy recharges every 3 hours.
                        </Text>
                    </Flex>

                    <Flex flexWrap="wrap" alignItems="center" gap="2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleOpenCharacters}
                        >
                            <LuUsers />
                            Characters
                        </Button>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleOpenTasks}
                        >
                            <LuListChecks />
                            Tasks
                        </Button>

                        <CompanionNote status={companion} />
                    </Flex>
                </Flex>

                {characters.length === 0 ? (
                    <NoCharacters onAdd={handleOpenCharacters} />
                ) : (
                    <CompanionLocksContext value={locks}>
                        <ArenaUnknownContext
                            value={{
                                owners: arenaUnknown,
                                onConfirm: confirmArena,
                            }}
                        >
                            <TrackerBoard
                                characters={characters}
                                tasks={tasks}
                                counts={counts}
                                energy={energy}
                                cubeKeys={cubeKeys}
                                notes={notes}
                                membership={membership}
                                entries={entries}
                                minimized={minimized}
                                goalsOpen={goalsOpen}
                                ignored={ignored}
                                corridorHolds={corridorHolds}
                                companionRunning={companion.state === "running"}
                                periods={periods}
                                playingId={findPlayingId(companion, characters)}
                                onCountChange={changeCount}
                                onEntriesChange={changeEntries}
                                onEnergyChange={changeEnergy}
                                onCubeKeysChange={changeCubeKeys}
                                onNoteChange={changeNote}
                                onMinimizedChange={changeMinimized}
                                onIgnoredChange={changeIgnored}
                                onGoalsOpenChange={changeGoalsOpen}
                            />
                        </ArenaUnknownContext>
                    </CompanionLocksContext>
                )}
            </Flex>

            <NewCharacterDialog
                characters={newCharacters}
                onAdd={addGameCharacter}
                onDecline={declineCharacter}
            />

            <CharactersDialog
                characters={characters}
                membership={membership}
                open={charactersOpen}
                onOpenChange={setCharactersOpen}
                onCreate={createCharacter}
                onChange={changeCharacter}
                onDelete={deleteCharacter}
                onMove={shiftCharacter}
                onMembershipChange={changeMembership}
            />

            <TasksDialog
                sections={sections}
                open={tasksOpen}
                usesStarterTasks={usesStarterTasks}
                removedPresets={removedPresets}
                onOpenChange={setTasksOpen}
                onCreate={createTask}
                onChange={changeTask}
                onDelete={deleteTask}
                onMove={shiftTask}
                onRestore={restoreTasks}
                onPresetRestore={addPresetBack}
            />
        </Container>
    )
}
