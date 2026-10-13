import { BoardInstance } from "./BoardInstance"
import { layouts, type LayoutType } from "./config/layouts"
import type { UseBoardStateOptions } from "./hooks/useBoardState"

type DaevanionBoardProps = Omit<
    UseBoardStateOptions,
    "layout" | "layoutName"
> & {
    layout: LayoutType
}

// Keyed by board and class so each one starts from its own saved state.
export const DaevanionBoard = ({
    layout,
    classPreset,
    ...props
}: DaevanionBoardProps) => {
    return (
        <BoardInstance
            key={`${layout}-${classPreset.id}`}
            layout={layouts[layout]}
            layoutName={layout}
            classPreset={classPreset}
            {...props}
        />
    )
}
