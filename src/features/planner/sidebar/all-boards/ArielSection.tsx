import { Text } from "@chakra-ui/react"
import { useState } from "react"
import { useStatBoardSettings } from "@planner/hooks/useStatBoardSettings"
import {
    readPrioritiesOpen,
    writePrioritiesOpen,
} from "@planner/storage/prioritiesOpen"
import { PointsField } from "@common/PointsField"
import { Section } from "@common/Section"
import { Term } from "@common/Term"
import { StatBoardPriorities } from "../priorities/StatBoardPriorities"

type ArielSectionProps = {
    classId: string
}

export const ArielSection = ({ classId }: ArielSectionProps) => {
    const { settings, update } = useStatBoardSettings(classId, "ariel")

    const [isOpen, setIsOpen] = useState(() => readPrioritiesOpen("ariel"))

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        writePrioritiesOpen("ariel", open)
    }

    const handlePointsChange = (points: number) => {
        update({ ...settings, points: points })
    }

    return (
        <Section
            title="Ariel"
            variant="featured"
            open={isOpen}
            onOpenChange={handleOpenChange}
        >
            <Text textStyle="hint">
                <Term>Ariel</Term> has its own points (
                <Term>Daevanion Crystal: Ariel</Term>).
            </Text>

            <PointsField
                label="Ariel points"
                value={settings.points}
                onChange={handlePointsChange}
            />

            <StatBoardPriorities classId={classId} board="ariel" />
        </Section>
    )
}
