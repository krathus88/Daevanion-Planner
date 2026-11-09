import { Text } from "@chakra-ui/react"
import { useState } from "react"
import { useArielSettings } from "@planner/hooks/useArielSettings"
import {
    readPrioritiesOpen,
    writePrioritiesOpen,
} from "@planner/storage/prioritiesOpen"
import { PointsField } from "@common/PointsField"
import { Section } from "@common/Section"
import { Term } from "@common/Term"
import { ArielPriorities } from "../priorities/ArielPriorities"

type ArielSectionProps = {
    classId: string
}

export const ArielSection = ({ classId }: ArielSectionProps) => {
    const { settings, update } = useArielSettings(classId)

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

            <ArielPriorities classId={classId} />
        </Section>
    )
}
