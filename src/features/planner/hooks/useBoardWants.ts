import type { ClassPreset } from "@config/classPresets"
import { useEffect, useState } from "react"
import type { BoardId } from "@config/boards"
import { errorMessage } from "@planner/logic/errorMessage"
import {
    boardWants,
    resolveWants,
    wantRank,
    type Want,
} from "@planner/logic/boardWants"
import {
    defaultAbilityPriorities,
    readAbilityPriorities,
} from "@planner/storage/abilityPriorities"
import {
    readWantChoices,
    writeWantChoices,
    type BoardWantChoices,
} from "@planner/storage/boardStorage"
import { subscribeToClassSettings } from "@planner/storage/classSettings"
import {
    DEFAULT_SPECIAL_PRIORITIES,
    readSpecialPriorities,
} from "@planner/storage/specialPriorities"

const readRanks = (classPreset: ClassPreset) => {
    try {
        return {
            priorities: readAbilityPriorities(classPreset),
            specialPriorities: readSpecialPriorities(classPreset.id),
            error: null,
        }
    } catch (error) {
        return {
            priorities: defaultAbilityPriorities(classPreset),
            specialPriorities: DEFAULT_SPECIAL_PRIORITIES,
            error: errorMessage(error, "Could not read the class's ranks."),
        }
    }
}

export const useBoardWants = (
    classPreset: ClassPreset,
    layoutName: BoardId,
) => {
    const [wants] = useState(() => boardWants(classPreset, layoutName))
    const [ranks, setRanks] = useState(() => readRanks(classPreset))
    const [stored] = useState(() => readWantChoices(classPreset.id, layoutName))
    const [choices, setChoices] = useState<BoardWantChoices>(
        () => stored.value ?? {},
    )
    const [saveError, setSaveError] = useState(stored.error)

    useEffect(
        () =>
            subscribeToClassSettings(classPreset.id, () => {
                setRanks(readRanks(classPreset))
            }),
        [classPreset],
    )

    const values = resolveWants({
        wants: wants,
        choices: choices,
        priorities: ranks.priorities,
        specialPriorities: ranks.specialPriorities,
    })

    const needCells = new Set(
        wants.flatMap((want) =>
            values.get(want.id) === "need" ? want.keys : [],
        ),
    )
    const preferredCells = new Set(
        wants.flatMap((want) =>
            values.get(want.id) === "prefer" ? want.keys : [],
        ),
    )
    const preferred = new Set(
        wants
            .filter((want) => values.get(want.id) === "prefer")
            .map((want) => want.id),
    )

    const setWant = (id: string, want: Want) => {
        const next = { ...choices, [id]: want }
        setChoices(next)
        setSaveError(writeWantChoices(classPreset.id, layoutName, next))
    }

    const rankOf = (want: (typeof wants)[number]) => {
        return wantRank(want, ranks.priorities, ranks.specialPriorities)
    }
    const byRank = [...wants].sort(
        (left, right) => rankOf(left) - rankOf(right),
    )

    return {
        wants: byRank,
        values: values,
        needCells: needCells,
        preferredCells: preferredCells,
        preferred: preferred,
        error: saveError ?? ranks.error,
        setWant: setWant,
    }
}
