import { Button, Container, Flex, Heading, Text } from "@chakra-ui/react"
import { useNow } from "@timers/hooks/useNow"
import { useEffect, useState } from "react"
import { LuListChecks, LuUsers } from "react-icons/lu"
import { TrackerBoard } from "./cards/TrackerBoard"
import { useTrackerData } from "./hooks/useTrackerData"
import { getResetPeriods } from "./logic/resetPeriods"
import { getTaskSections } from "./logic/taskSections"
import { CharactersDialog } from "./manage/CharactersDialog"
import { TasksDialog } from "./manage/TasksDialog"
import { NoCharacters } from "./NoCharacters"

export const TrackerPage = () => {
    const now = useNow()
    const {
        characters,
        tasks,
        counts,
        entries,
        minimized,
        ignored,
        usesStarterTasks,
        removedPresets,
        changeCount,
        changeEntries,
        changeMinimized,
        changeIgnored,
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
    const periods = getResetPeriods(now)

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
                            (07:00 UTC) or the weekly one (Wednesday 07:00 UTC).
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
                        entries={entries}
                        minimized={minimized}
                        ignored={ignored}
                        periods={periods}
                        now={now}
                        onCountChange={changeCount}
                        onEntriesChange={changeEntries}
                        onMinimizedChange={changeMinimized}
                        onIgnoredChange={changeIgnored}
                    />
                )}
            </Flex>

            <CharactersDialog
                characters={characters}
                open={charactersOpen}
                onOpenChange={setCharactersOpen}
                onCreate={createCharacter}
                onChange={changeCharacter}
                onDelete={deleteCharacter}
                onMove={shiftCharacter}
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
