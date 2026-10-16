import type { ClassPreset } from "@config/classPresets"
import { Text } from "@chakra-ui/react"
import { useState } from "react"
import {
    readPrioritiesOpen,
    writePrioritiesOpen,
} from "@planner/storage/prioritiesOpen"
import { Section } from "@common/Section"
import { AbilityPriorityList } from "./AbilityPriorityList"
import { RankOrderList } from "./RankOrderList"
import { SpecialPriorityList } from "./SpecialPriorityList"
import { StatPriorityList } from "./StatPriorityList"

type PrioritySectionProps = {
    classPreset: ClassPreset
    hint: string
}

// The priority lists the All boards optimizer reads, folded into one
// section.
export const PrioritySection = ({
    classPreset,
    hint,
}: PrioritySectionProps) => {
    const [isOpen, setIsOpen] = useState(() => readPrioritiesOpen("all"))

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        writePrioritiesOpen("all", open)
    }

    return (
        <Section
            title="Optimizer priorities"
            variant="featured"
            open={isOpen}
            onOpenChange={handleOpenChange}
        >
            <Text textStyle="hint">{hint}</Text>

            <Section title="Special node priorities" variant="sub">
                <SpecialPriorityList classId={classPreset.id} />
            </Section>

            <Section title="Ability priorities" variant="sub">
                <AbilityPriorityList classPreset={classPreset} />
            </Section>

            <Section title="Stat priorities" variant="sub">
                <StatPriorityList classPreset={classPreset} />
            </Section>

            <Section title="Same-rank order" variant="sub">
                <RankOrderList classId={classPreset.id} />
            </Section>
        </Section>
    )
}
