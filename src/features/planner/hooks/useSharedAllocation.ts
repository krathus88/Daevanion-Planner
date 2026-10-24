import { useEffect, useState } from "react"
import { MAIN_BOARD_IDS, type BoardId } from "@config/boards"
import { readAllocationSnapshot } from "@planner/storage/allocationSnapshot"
import {
    applyPlannerToBoard,
    notifyPlansReplaced,
    subscribeToBoardStorage,
    writeSharedAllocation,
} from "@planner/storage/boardStorage"

export const useSharedAllocation = (classId: string) => {
    const [snapshot, setSnapshot] = useState(() =>
        readAllocationSnapshot(classId),
    )

    useEffect(
        () =>
            subscribeToBoardStorage(() =>
                setSnapshot(readAllocationSnapshot(classId)),
            ),
        [classId],
    )

    const setTotalPoints = (totalPoints: number) => {
        const allocation = { ...snapshot.allocation, totalPoints: totalPoints }
        setSnapshot((current) => ({ ...current, allocation: allocation }))
        const error = writeSharedAllocation(classId, allocation)
        if (error) {
            setSnapshot((current) => ({ ...current, error: error }))
        }
    }

    // "" (None) clears the board.
    const selectRoute = (layout: BoardId, plannerId: string) => {
        const error = applyPlannerToBoard(classId, layout, plannerId)
        if (error) {
            setSnapshot((current) => ({ ...current, error: error }))
            return
        }

        notifyPlansReplaced([layout])
    }

    const totalPoints = snapshot.allocation.totalPoints
    const allocatedPoints = MAIN_BOARD_IDS.reduce(
        (total, layout) => total + snapshot.routeCosts[layout],
        0,
    )

    return {
        snapshot: snapshot,
        totalPoints: totalPoints,
        allocatedPoints: allocatedPoints,
        remainingPoints: totalPoints - allocatedPoints,
        setTotalPoints: setTotalPoints,
        selectRoute: selectRoute,
    }
}

export type SharedAllocationState = ReturnType<typeof useSharedAllocation>
