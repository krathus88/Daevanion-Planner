import { BoardWorkspace } from "./BoardWorkspace"
import { BoardContext } from "./context/boardContext"
import { useBoardState, type UseBoardStateOptions } from "./hooks/useBoardState"

export const BoardInstance = ({
    layout,
    layoutName,
    classPreset,
    gameCheck,
    view,
    sidebarTab,
    onViewChange,
    onSidebarTabChange,
}: UseBoardStateOptions) => {
    const board = useBoardState({
        layout: layout,
        layoutName: layoutName,
        classPreset: classPreset,
        gameCheck: gameCheck,
        view: view,
        sidebarTab: sidebarTab,
        onViewChange: onViewChange,
        onSidebarTabChange: onSidebarTabChange,
    })

    return (
        <BoardContext value={board}>
            <BoardWorkspace />
        </BoardContext>
    )
}
