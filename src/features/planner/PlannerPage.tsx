import { Container } from "@chakra-ui/react"
import type { ClassId, ClassPreset } from "@config/classPresets"
import { useState } from "react"
import type { BoardId } from "@config/boards"
import { DaevanionBoard } from "./DaevanionBoard"
import { useGameCheck } from "./hooks/useGameCheck"
import { useClassDocumentMeta } from "./hooks/useClassDocumentMeta"
import type { BoardView, SidebarTab } from "./types"

type PlannerPageProps = {
    classId: ClassId
    classPreset: ClassPreset
    layout: BoardId
    boardView: BoardView
    onBoardViewChange: (view: BoardView) => void
}

export const PlannerPage = ({
    classId,
    classPreset,
    layout,
    boardView,
    onBoardViewChange,
}: PlannerPageProps) => {
    useClassDocumentMeta(classId)
    // Above the per-board state so switching board keeps what was read.
    const gameCheck = useGameCheck(layout)

    // Above the per-board state so switching board keeps the sidebar tab.
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>("plan")

    return (
        <Container as="main" py={{ base: "4", md: "6" }} maxW="8xl" flex="1">
            <DaevanionBoard
                classPreset={classPreset}
                gameCheck={gameCheck}
                layout={layout}
                sidebarTab={sidebarTab}
                view={boardView}
                onSidebarTabChange={setSidebarTab}
                onViewChange={onBoardViewChange}
            />
        </Container>
    )
}
