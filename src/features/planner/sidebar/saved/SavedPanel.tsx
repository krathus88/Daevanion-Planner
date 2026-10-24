import { Flex } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { BackupShareSection } from "./BackupShareSection"
import { ManualBoardsSection } from "./ManualBoardsSection"
import { PlannerRoutesSection } from "./PlannerRoutesSection"

export const SavedPanel = () => {
    const { view, planner } = useBoard()

    const activeSource = planner.activePlanner?.source

    // Applied on mount; remounting re-applies it.
    return (
        <Flex
            key={`${view}-${activeSource ?? "none"}`}
            flexDir="column"
            gap="3"
        >
            <PlannerRoutesSection
                isHistoryActive={activeSource === "history"}
                defaultOpen={view === "planner"}
            />

            <ManualBoardsSection defaultOpen={view !== "planner"} />

            <BackupShareSection />
        </Flex>
    )
}
