import { Container } from "@chakra-ui/react"
import type { ClassId, ClassPreset } from "@config/classPresets"
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
    sidebarTab: SidebarTab
    onBoardViewChange: (view: BoardView) => void
    onSidebarTabChange: (tab: SidebarTab) => void
}

export const PlannerPage = ({
    classId,
    classPreset,
    layout,
    boardView,
    sidebarTab,
    onBoardViewChange,
    onSidebarTabChange,
}: PlannerPageProps) => {
    useClassDocumentMeta(classId)
    // Above the per-board state so switching board keeps what was read.
    const gameCheck = useGameCheck(layout)

    return (
        <Container as="main" py={{ base: "4", md: "6" }} maxW="8xl" flex="1">
            <DaevanionBoard
                classPreset={classPreset}
                gameCheck={gameCheck}
                layout={layout}
                sidebarTab={sidebarTab}
                view={boardView}
                onSidebarTabChange={onSidebarTabChange}
                onViewChange={onBoardViewChange}
            />
        </Container>
    )
}
