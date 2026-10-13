import { BoardWorkspace } from "./BoardWorkspace"
import { BoardContext } from "./context/boardContext"
import { useBoardState, type UseBoardStateOptions } from "./hooks/useBoardState"

// Owns one board's state and shares it with everything below.
export const BoardInstance = ({
    layout,
    layoutName,
    classPreset,
    view,
    sidebarTab,
    onViewChange,
    onSidebarTabChange,
}: UseBoardStateOptions) => {
    const board = useBoardState({
        layout: layout,
        layoutName: layoutName,
        classPreset: classPreset,
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
