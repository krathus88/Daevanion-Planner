import { Container, Flex } from "@chakra-ui/react"
import { classPresets, type ClassId } from "@config/classPresets"
import { Footer } from "@layout/Footer"
import { Header } from "@layout/Header/Header"
import { useState } from "react"
import type { LayoutType } from "./config/layouts"
import { DaevanionBoard } from "./DaevanionBoard"
import { useClassDocumentMeta } from "./hooks/useClassDocumentMeta"
import type { BoardView, SidebarTab } from "./types"

type PlannerPageProps = {
    classId: ClassId
    layout: LayoutType
    boardView: BoardView
    onBoardViewChange: (view: BoardView) => void
}

export const PlannerPage = ({
    classId,
    layout,
    boardView,
    onBoardViewChange,
}: PlannerPageProps) => {
    const selectedClass = classPresets[classId]

    useClassDocumentMeta(selectedClass)

    // Lives here, above the per-board state, so switching board keeps the
    // sidebar tab. The page is keyed by class, so a new class starts on Plan.
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>("plan")

    return (
        <Flex minH="vh" flexDir="column">
            <Header classId={classId} layout={layout} />

            <Container
                as="main"
                py={{ base: "4", md: "6" }}
                maxW="8xl"
                flex="1"
            >
                <DaevanionBoard
                    classPreset={selectedClass}
                    layout={layout}
                    sidebarTab={sidebarTab}
                    view={boardView}
                    onSidebarTabChange={setSidebarTab}
                    onViewChange={onBoardViewChange}
                />
            </Container>

            <Footer />
        </Flex>
    )
}
