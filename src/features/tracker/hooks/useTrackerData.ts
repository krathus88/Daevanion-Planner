import type { NewGameCharacter } from "@account/game/gameCharacters"
import { ARENA_TASKS } from "@account/game/gameIds"
import { reapplyGameSnapshot } from "@account/game/gameSync"
import { requestPersistentStorage } from "@planner/storage/persistStorage"
import type { EntriesLeft } from "@tracker/logic/taskEntries"
import type { EnergyLeft } from "@tracker/logic/odyleEnergy"
import {
    addCharacter,
    declineGameCharacter,
    addTask,
    getRemovedPresets,
    getTasks,
    moveCharacter,
    moveTask,
    removeCharacter,
    removeTask,
    restorePreset,
    restoreStarterTasks,
    confirmArenaWeek,
    setCount,
    setEntries,
    setGoalsOpen,
    setCubeKeys,
    setEnergy,
    setIgnored,
    setMembership,
    setNote,
    setMinimized,
    updateCharacter,
    updateTask,
    type CharacterFields,
    type TaskFields,
} from "@tracker/logic/trackerEdits"
import {
    readTrackerData,
    subscribeToTrackerData,
    writeTrackerData,
} from "@tracker/storage/trackerData"
import type { CharacterNote, TrackerTask } from "@tracker/types"
import { useSyncExternalStore } from "react"

export const useTrackerData = () => {
    const data = useSyncExternalStore(subscribeToTrackerData, readTrackerData)

    const changeCount = (
        owner: string,
        task: TrackerTask,
        period: number,
        count: number,
    ) => {
        const next = setCount(readTrackerData(), owner, task, period, count)

        // An arena count entered in a week the companion couldn't work out
        // sets where that week began.
        writeTrackerData(
            ARENA_TASKS[task.id] ? confirmArenaWeek(next, owner, period) : next,
        )
        requestPersistentStorage()
    }

    const confirmArena = (owner: string, period: number) => {
        writeTrackerData(confirmArenaWeek(readTrackerData(), owner, period))
    }

    const changeEntries = (
        owner: string,
        task: TrackerTask,
        period: number,
        left: EntriesLeft,
    ) => {
        writeTrackerData(
            setEntries(readTrackerData(), owner, task, period, left),
        )
        requestPersistentStorage()
    }

    const createCharacter = (fields: CharacterFields) => {
        writeTrackerData(addCharacter(readTrackerData(), fields))
        requestPersistentStorage()
    }

    // A character the companion app sent: added, then filled from its
    // snapshot at once.
    const addGameCharacter = (character: NewGameCharacter) => {
        createCharacter({
            name: character.name,
            classId: character.classId,
            server: character.server,
        })
        reapplyGameSnapshot(character.key)
    }

    const declineCharacter = (character: NewGameCharacter) => {
        writeTrackerData(
            declineGameCharacter(
                readTrackerData(),
                character.server,
                character.name,
            ),
        )
    }

    const changeCharacter = (id: string, changes: Partial<CharacterFields>) => {
        writeTrackerData(updateCharacter(readTrackerData(), id, changes))
    }

    const deleteCharacter = (id: string) => {
        writeTrackerData(removeCharacter(readTrackerData(), id))
    }

    const shiftCharacter = (id: string, targetId: string) => {
        writeTrackerData(moveCharacter(readTrackerData(), id, targetId))
    }

    const createTask = (fields: TaskFields) => {
        writeTrackerData(addTask(readTrackerData(), fields))
    }

    const changeTask = (id: string, fields: TaskFields) => {
        writeTrackerData(updateTask(readTrackerData(), id, fields))
    }

    const deleteTask = (id: string) => {
        writeTrackerData(removeTask(readTrackerData(), id))
    }

    const shiftTask = (id: string, targetId: string) => {
        writeTrackerData(moveTask(readTrackerData(), id, targetId))
    }

    const restoreTasks = () => {
        writeTrackerData(restoreStarterTasks(readTrackerData()))
    }

    const addPresetBack = (id: string) => {
        writeTrackerData(restorePreset(readTrackerData(), id))
    }

    const changeMinimized = (owners: readonly string[], minimized: boolean) => {
        writeTrackerData(setMinimized(readTrackerData(), owners, minimized))
    }

    const changeGoalsOpen = (owner: string, open: boolean) => {
        writeTrackerData(setGoalsOpen(readTrackerData(), owner, open))
    }

    const changeIgnored = (owner: string, taskId: string, ignored: boolean) => {
        writeTrackerData(setIgnored(readTrackerData(), owner, taskId, ignored))
    }

    const changeEnergy = (
        characterId: string,
        period: number,
        left: EnergyLeft,
    ) => {
        writeTrackerData(
            setEnergy(readTrackerData(), characterId, period, left),
        )
        requestPersistentStorage()
    }

    const changeCubeKeys = (characterId: string, count: number) => {
        writeTrackerData(setCubeKeys(readTrackerData(), characterId, count))
    }

    const changeNote = (characterId: string, note: CharacterNote) => {
        writeTrackerData(setNote(readTrackerData(), characterId, note))
    }

    const changeMembership = (membership: boolean) => {
        writeTrackerData(setMembership(readTrackerData(), membership))
    }

    const tasks = getTasks(data)

    return {
        characters: data.characters,
        tasks: tasks,
        energy: data.energy,
        cubeKeys: data.cubeKeys,
        arena: data.arena,
        corridorHolds: data.corridorHolds,
        declined: data.declined,
        notes: data.notes,
        membership: data.membership,
        counts: data.counts,
        entries: data.entries,
        minimized: data.minimized,
        goalsOpen: data.goalsOpen,
        ignored: data.ignored,
        usesStarterTasks: data.tasks === null,
        removedPresets: getRemovedPresets(data),
        changeMinimized: changeMinimized,
        changeMembership: changeMembership,
        changeEnergy: changeEnergy,
        changeCubeKeys: changeCubeKeys,
        changeNote: changeNote,
        changeIgnored: changeIgnored,
        changeGoalsOpen: changeGoalsOpen,
        changeCount: changeCount,
        confirmArena: confirmArena,
        addGameCharacter: addGameCharacter,
        declineCharacter: declineCharacter,
        changeEntries: changeEntries,
        createCharacter: createCharacter,
        changeCharacter: changeCharacter,
        deleteCharacter: deleteCharacter,
        shiftCharacter: shiftCharacter,
        createTask: createTask,
        changeTask: changeTask,
        deleteTask: deleteTask,
        shiftTask: shiftTask,
        restoreTasks: restoreTasks,
        addPresetBack: addPresetBack,
    }
}
