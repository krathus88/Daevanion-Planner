import { Flex } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { AbilityPriorityList } from "./AbilityPriorityList"
import { StatPriorityList } from "./StatPriorityList"

export const PrioritiesTab = () => {
    const { classPreset } = useBoard()

    return (
        <Flex flexDir="column" gap="6">
            <AbilityPriorityList classPreset={classPreset} />

            <StatPriorityList classPreset={classPreset} />
        </Flex>
    )
}
