import { requestPersistentStorage } from "@planner/storage/persistStorage"
import type { EntriesLeft } from "@tracker/logic/taskEntries"
import type { EnergyLeft } from "@tracker/logic/odyleEnergy"
import {
    addCharacter,
    addTask,
    getRemovedPresets,
    getTasks,
    moveCharacter,
    moveTask,
    removeCharacter,
    removeTask,
    restorePreset,
    restoreStarterTasks,
    setCount,
    setEntries,
    setGoalsOpen,
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
        writeTrackerData(
            setCount(readTrackerData(), owner, task, period, count),
        )
        requestPersistentStorage()
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
        changeNote: changeNote,
        changeIgnored: changeIgnored,
        changeGoalsOpen: changeGoalsOpen,
        changeCount: changeCount,
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
