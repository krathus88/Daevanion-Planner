import { useEffect, useState } from "react"
import { errorMessage } from "@planner/logic/errorMessage"
import { subscribeToClassSettings } from "@planner/storage/classSettings"
import {
    DEFAULT_RANK_ORDER,
    readRankOrder,
    writeRankOrder,
    type RankOrder,
} from "@planner/storage/rankOrder"

const readOrder = (classId: string) => {
    try {
        return { order: readRankOrder(classId), error: null }
    } catch (error) {
        return {
            order: DEFAULT_RANK_ORDER,
            error: errorMessage(error, "Could not read same-rank order."),
        }
    }
}

export const useRankOrder = (classId: string) => {
    const [initial] = useState(() => readOrder(classId))
    const [order, setOrder] = useState(initial.order)
    const [error, setError] = useState<string | null>(initial.error)

    useEffect(
        () =>
            subscribeToClassSettings(classId, () => {
                const next = readOrder(classId)
                setOrder(next.order)
                setError(next.error)
            }),
        [classId],
    )

    const update = (next: RankOrder) => {
        const writeError = writeRankOrder(classId, next)
        if (writeError) {
            setError(writeError)
            return
        }

        setOrder(next)
        setError(null)
    }

    return { order: order, error: error, update: update }
}
