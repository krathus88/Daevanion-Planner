import { Flex, Text } from "@chakra-ui/react"
import { useState } from "react"
import { useBoard } from "@planner/context/boardContext"
import type { BoardWant, Want } from "@planner/logic/boardWants"
import {
    readPrioritiesOpen,
    writePrioritiesOpen,
} from "@planner/storage/prioritiesOpen"
import { Section } from "@common/Section"
import { StatusText } from "@common/StatusText"
import { StatPriorityList } from "../priorities/StatPriorityList"
import { BoardWantList } from "./BoardWantList"

// Skills and passives share one section, labelled apart as on the All
// boards tab.
const ABILITY_GROUPS = [
    { kind: "skill", label: "Skills" },
    { kind: "passive", label: "Passives" },
] as const

// What Find a good path should take on this board.
export const BoardPriorities = () => {
    const { classPreset, layoutName, planner, wants } = useBoard()

    const [isOpen, setIsOpen] = useState(() => readPrioritiesOpen("board"))

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        writePrioritiesOpen("board", open)
    }

    const specialWants = wants.wants.filter((want) => want.kind === "special")
    const abilityGroups = ABILITY_GROUPS.map((group) => ({
        ...group,
        wants: wants.wants.filter((want) => want.kind === group.kind),
    })).filter((group) => group.wants.length > 0)

    const handleWantChange = (want: BoardWant, value: Want) => {
        wants.setWant(want.id, value)
    }

    return (
        <Section
            title="Route preferences"
            variant="featured"
            open={isOpen}
            onOpenChange={handleOpenChange}
        >
            <Text textStyle="hint">
                Need makes Find a good path take all of its nodes on this board,
                on top of the ones you click (blue dot). Prefer only picks
                between equally cheap routes, so it never costs extra points
                (green ring). Defaults follow the ranks on the All boards tab:
                1–2 Need, 3 Prefer, the rest Skip.
            </Text>

            <Section title="Special nodes" variant="sub">
                <BoardWantList
                    wants={specialWants}
                    values={wants.values}
                    plannedPath={planner.plannedPath}
                    onChange={handleWantChange}
                />
            </Section>

            <Section title="Abilities" variant="sub">
                {abilityGroups.map((group, index) => (
                    <Flex
                        key={group.kind}
                        mt={index > 0 ? "2" : undefined}
                        flexDir="column"
                        gap="2"
                    >
                        <Text textStyle="label">{group.label}</Text>

                        <BoardWantList
                            wants={group.wants}
                            values={wants.values}
                            plannedPath={planner.plannedPath}
                            onChange={handleWantChange}
                        />
                    </Flex>
                ))}
            </Section>

            <Section title="Stat priorities" variant="sub">
                <StatPriorityList
                    classPreset={classPreset}
                    layout={layoutName}
                />
            </Section>

            {wants.error && <StatusText>{wants.error}</StatusText>}
        </Section>
    )
}
