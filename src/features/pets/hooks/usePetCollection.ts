import { PET_LEVELS } from "@pets/logic/petLevels"
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

    // 0 marks the pet as locked again.
    const changeLevel = (petId: number, level: number) => {
        const current = readPetCollection()
        const nextLevels = { ...current.levels }

        if (level > 0) {
            nextLevels[petId] = level
        } else {
            delete nextLevels[petId]
        }

        writePetCollection({ ...current, levels: nextLevels })
        requestPersistentStorage()
    }

    // Many pets in one save, e.g. levels read from screenshots.
    const changeLevels = (updates: { petId: number; level: number }[]) => {
        const current = readPetCollection()
        const nextLevels = { ...current.levels }

        for (const update of updates) {
            if (update.level > 0) {
                nextLevels[update.petId] = update.level
            } else {
                delete nextLevels[update.petId]
            }
        }

        writePetCollection({ ...current, levels: nextLevels })
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
        hiddenLevels: collection.hiddenLevels,
        minimized: collection.minimized,
        listMinimized: collection.listMinimized,
        tipDismissed: collection.tipDismissed,
        changeLevel: changeLevel,
        changeLevels: changeLevels,
        changeLevelHidden: changeLevelHidden,
        changeMinimized: changeMinimized,
        changeListMinimized: changeListMinimized,
        dismissTip: dismissTip,
    }
}
