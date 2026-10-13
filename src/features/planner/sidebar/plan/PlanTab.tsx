import { Flex } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { ManualPanel } from "./ManualPanel"
import { ModeToggle } from "./ModeToggle"
import { PlannerPanel } from "./PlannerPanel"

export const PlanTab = () => {
    const { view } = useBoard()

    return (
        <Flex flexDir="column" gap="4">
            <ModeToggle />

            {view === "board" ? <ManualPanel /> : <PlannerPanel />}
        </Flex>
    )
}
