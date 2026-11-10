import { useAuth } from "@account/hooks/useAuth"
import type { ProfessionId } from "@crafting/config/professions"
import {
    setBought,
    setOwned,
    setPrice,
    setProficiency,
    setServer,
    setSuccess,
} from "@crafting/logic/settingsEdits"
import { writeSharedPrice } from "@crafting/shared/sharedPrices"
import {
    readCraftingSettings,
    subscribeToCraftingSettings,
    writeCraftingSettings,
} from "@crafting/storage/craftingSettings"
import { useSyncExternalStore } from "react"

export const useCraftingSettings = () => {
    const auth = useAuth()
    const settings = useSyncExternalStore(
        subscribeToCraftingSettings,
        readCraftingSettings,
    )

    const changeServer = (server: string) => {
        writeCraftingSettings(setServer(readCraftingSettings(), server))
    }

    const changeOwned = (id: number, owned: number) => {
        writeCraftingSettings(setOwned(readCraftingSettings(), id, owned))
    }

    // Kept on this device either way; logged in, also shared with everyone
    // on the server.
    const changePrice = (id: number, price: number | null) => {
        const current = readCraftingSettings()

        writeCraftingSettings(setPrice(current, id, price, Date.now()))

        if (auth.status === "signedIn") {
            void writeSharedPrice(current.server, id, price)
        }
    }

    const changeProficiency = (
        profession: ProfessionId,
        level: number | null,
    ) => {
        writeCraftingSettings(
            setProficiency(readCraftingSettings(), profession, level),
        )
    }

    const changeSuccess = (id: number, success: number | null) => {
        writeCraftingSettings(setSuccess(readCraftingSettings(), id, success))
    }

    const changeBought = (id: number, bought: boolean) => {
        writeCraftingSettings(setBought(readCraftingSettings(), id, bought))
    }

    return {
        settings: settings,
        sharing: auth.status === "signedIn",
        changeServer: changeServer,
        changeOwned: changeOwned,
        changePrice: changePrice,
        changeSuccess: changeSuccess,
        changeProficiency: changeProficiency,
        changeBought: changeBought,
    }
}
