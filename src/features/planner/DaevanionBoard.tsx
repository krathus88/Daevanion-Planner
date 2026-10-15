import { BoardInstance } from "./BoardInstance"
import type { BoardId } from "@config/boards"
import { layouts } from "./config/layouts"
import type { UseBoardStateOptions } from "./hooks/useBoardState"
import { useStorageRevision } from "./storage/storageRevision"

type DaevanionBoardProps = Omit<
    UseBoardStateOptions,
    "layout" | "layoutName"
> & {
    layout: BoardId
}

// Keyed by board and class so each one starts from its own saved state,
// and by storage revision so it reloads after an import.
export const DaevanionBoard = ({
    layout,
    classPreset,
    ...props
}: DaevanionBoardProps) => {
    const { revision } = useStorageRevision()

    return (
        <BoardInstance
            key={`${layout}-${classPreset.id}-${revision}`}
            layout={layouts[layout]}
            layoutName={layout}
            classPreset={classPreset}
            {...props}
        />
    )
}
