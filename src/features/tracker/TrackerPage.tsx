import { Button, Container, Flex, Heading, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { LuListChecks, LuUsers } from "react-icons/lu"
import { TrackerBoard } from "./cards/TrackerBoard"
import { useResetPeriods } from "./hooks/useResetPeriods"
import { useTrackerData } from "./hooks/useTrackerData"
import { getTaskSections } from "./logic/taskSections"
import { CharactersDialog } from "./manage/CharactersDialog"
import { TasksDialog } from "./manage/TasksDialog"
import { NoCharacters } from "./NoCharacters"

export const TrackerPage = () => {
    const periods = useResetPeriods()
    const {
        characters,
        tasks,
        energy,
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
        changeEntries,
        changeMinimized,
        changeMembership,
        changeEnergy,
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
                    </Flex>
                </Flex>

                {characters.length === 0 ? (
                    <NoCharacters onAdd={handleOpenCharacters} />
                ) : (
                    <TrackerBoard
                        characters={characters}
                        tasks={tasks}
                        counts={counts}
                        energy={energy}
                        notes={notes}
                        membership={membership}
                        entries={entries}
                        minimized={minimized}
                        goalsOpen={goalsOpen}
                        ignored={ignored}
                        periods={periods}
                        onCountChange={changeCount}
                        onEntriesChange={changeEntries}
                        onEnergyChange={changeEnergy}
                        onNoteChange={changeNote}
                        onMinimizedChange={changeMinimized}
                        onIgnoredChange={changeIgnored}
                        onGoalsOpenChange={changeGoalsOpen}
                    />
                )}
            </Flex>

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
