import { levelFromSouls, PET_LEVELS } from "@pets/logic/petLevels"
import {
    readPetCollection,
    subscribeToPetCollection,
    writePetCollection,
} from "@pets/storage/petCollection"
import { requestPersistentStorage } from "@planner/storage/persistStorage"
import { useSyncExternalStore } from "react"

export const usePetCollection = () => {
    const collection = useSyncExternalStore(
        subscribeToPetCollection,
        readPetCollection,
    )

    // 0 marks the pet as locked again. Its souls restart at the level's start.
    const changeLevel = (petId: number, level: number) => {
        const current = readPetCollection()
        const nextLevels = { ...current.levels }
        const nextSouls = { ...current.souls }

        delete nextSouls[petId]

        if (level > 0) {
            nextLevels[petId] = level
        } else {
            delete nextLevels[petId]
        }

        writePetCollection({
            ...current,
            levels: nextLevels,
            souls: nextSouls,
        })
        requestPersistentStorage()
    }

    // Total souls for many pets in one save; their levels follow.
    const changeSouls = (updates: { petId: number; souls: number }[]) => {
        const current = readPetCollection()
        const nextLevels = { ...current.levels }
        const nextSouls = { ...current.souls }

        for (const update of updates) {
            const level = levelFromSouls(update.souls)

            nextSouls[update.petId] = update.souls

            if (level > 0) {
                nextLevels[update.petId] = level
            } else {
                delete nextLevels[update.petId]
            }
        }

        writePetCollection({
            ...current,
            levels: nextLevels,
            souls: nextSouls,
        })
        requestPersistentStorage()
    }

    const changeLevelHidden = (level: number, hidden: boolean) => {
        const current = readPetCollection()

        writePetCollection({
            ...current,
            hiddenLevels: PET_LEVELS.filter((item) => {
                return item === level
                    ? hidden
                    : current.hiddenLevels.includes(item)
            }),
        })
    }

    const changeMinimized = (minimized: boolean) => {
        writePetCollection({ ...readPetCollection(), minimized: minimized })
    }

    const changeListMinimized = (listMinimized: boolean) => {
        writePetCollection({
            ...readPetCollection(),
            listMinimized: listMinimized,
        })
    }

    const dismissTip = () => {
        writePetCollection({ ...readPetCollection(), tipDismissed: true })
    }

    return {
        levels: collection.levels,
        souls: collection.souls,
        hiddenLevels: collection.hiddenLevels,
        minimized: collection.minimized,
        listMinimized: collection.listMinimized,
        tipDismissed: collection.tipDismissed,
        changeLevel: changeLevel,
        changeSouls: changeSouls,
        changeLevelHidden: changeLevelHidden,
        changeMinimized: changeMinimized,
        changeListMinimized: changeListMinimized,
        dismissTip: dismissTip,
    }
}
