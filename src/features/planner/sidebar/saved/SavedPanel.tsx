import { Flex } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { ManualBoardsSection } from "./ManualBoardsSection"
import { PlannerRoutesSection } from "./PlannerRoutesSection"

export const SavedPanel = () => {
    const { view, planner } = useBoard()

    const activeSource = planner.activePlanner?.source

    // Open the section for the current mode, and within planner routes the
    // list holding the active route. Remounting on change re-applies this.
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
        </Flex>
    )
}
