import { createContext, useContext } from "react"
import type { BoardState } from "@planner/hooks/useBoardState"

export const BoardContext = createContext<BoardState | null>(null)

export const useBoard = () => {
    const board = useContext(BoardContext)

    if (!board) {
        throw new Error("useBoard must be used inside a BoardContext.")
    }

    return board
}
