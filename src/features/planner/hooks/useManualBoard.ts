import { useState } from "react"
import type { Position } from "@planner/config/boardConfig"
import type { BoardId } from "@config/boards"
import type { BoardLayout } from "@planner/config/layouts"
import {
    createInitialSelection,
    selectedNodeCost,
    toggleNodeSelection,
} from "@planner/logic/boardLogic"
import {
    clearBoardUndo,
    writeBoardUndo,
    writeSavedBoards,
    type BoardUndo,
    type SavedBoard,
} from "@planner/storage/boardStorage"
import type { BoardProgressState } from "./useBoardProgress"

type UseManualBoardOptions = {
    classId: string
    layoutName: BoardId
    layout: BoardLayout
    start: Position
    progress: BoardProgressState
    availablePoints: number
    initialUndo: BoardUndo | null
    initialSaved: SavedBoard[]
    excludeStart: (keys: string[]) => string[]
    setMessage: (message: string) => void
    cancelOptimization: () => void
}

// Manual mode: picking nodes by hand, with undo and saved boards.
export const useManualBoard = ({
    classId,
    layoutName,
    layout,
    start,
    progress,
    availablePoints,
    initialUndo,
    initialSaved,
    excludeStart,
    setMessage,
    cancelOptimization,
}: UseManualBoardOptions) => {
    const [boardUndo, setBoardUndo] = useState(initialUndo)
    const [savedBoards, setSavedBoards] = useState(initialSaved)
    const [boardSaveName, setBoardSaveName] = useState("")

    const selectCell = (position: Position) => {
        const result = toggleNodeSelection(
            layout,
            start,
            progress.selectedCells,
            position,
            remainingPoints,
        )
        const error = progress.persistProgress({
            selectedCells: [...result.selectedCells],
        })
        progress.setSelectedCells(result.selectedCells)
        setMessage(error ?? result.message)
    }

    const resetSelection = () => {
        const undo: BoardUndo = { selectedCells: [...progress.selectedCells] }
        const undoError = writeBoardUndo(classId, layoutName, undo)
        if (undoError) {
            setMessage(undoError)
            return
        }

        setBoardUndo(undo)
        progress.setSelectedCells(createInitialSelection())
        const progressError = progress.persistProgress({ selectedCells: [] })
        setMessage(progressError ?? "")
    }

    const restoreSelection = () => {
        if (!boardUndo) {
            return
        }

        const error = clearBoardUndo(classId, layoutName)
        if (error) {
            setMessage(error)
            return
        }

        const restored = excludeStart(boardUndo.selectedCells)
        progress.setSelectedCells(new Set(restored))
        setBoardUndo(null)
        const progressError = progress.persistProgress({
            selectedCells: restored,
        })
        setMessage(progressError ?? "")
    }

    const saveBoard = () => {
        const name = boardSaveName.trim()
        if (!name) {
            setMessage("Enter a name before saving this board.")
            return
        }

        const saved: SavedBoard = {
            id: crypto.randomUUID(),
            name: name,
            createdAt: Date.now(),
            selectedCells: [...progress.selectedCells],
            availablePoints: availablePoints,
        }
        const nextSavedBoards = [saved, ...savedBoards]
        const error = writeSavedBoards(classId, layoutName, nextSavedBoards)
        if (error) {
            setMessage(error)
            return
        }

        setSavedBoards(nextSavedBoards)
        setBoardSaveName("")
        setMessage(`Saved "${name}".`)
    }

    const loadBoard = (saved: SavedBoard) => {
        cancelOptimization()
        const loaded = excludeStart(saved.selectedCells)
        progress.setSelectedCells(new Set(loaded))
        const error = progress.persistProgress({ selectedCells: loaded })
        setMessage(error ?? `Loaded "${saved.name}".`)
    }

    const deleteBoard = (id: string) => {
        const nextSavedBoards = savedBoards.filter((saved) => saved.id !== id)
        const error = writeSavedBoards(classId, layoutName, nextSavedBoards)
        if (error) {
            setMessage(error)
            return
        }

        setSavedBoards(nextSavedBoards)
        setMessage("Saved board deleted.")
    }

    const spentPoints = selectedNodeCost(layout, progress.selectedCells)
    const remainingPoints = availablePoints - spentPoints

    return {
        selectedCells: progress.selectedCells,
        spentPoints: spentPoints,
        remainingPoints: remainingPoints,
        boardUndo: boardUndo,
        savedBoards: savedBoards,
        boardSaveName: boardSaveName,
        setBoardSaveName: setBoardSaveName,
        selectCell: selectCell,
        resetSelection: resetSelection,
        restoreSelection: restoreSelection,
        saveBoard: saveBoard,
        loadBoard: loadBoard,
        deleteBoard: deleteBoard,
    }
}
