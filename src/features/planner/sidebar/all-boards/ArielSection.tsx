import { Text } from "@chakra-ui/react"
import { useState } from "react"
import { useArielSettings } from "@planner/hooks/useArielSettings"
import {
    readPrioritiesOpen,
    writePrioritiesOpen,
} from "@planner/storage/prioritiesOpen"
import { PointsField } from "@common/PointsField"
import { Section } from "@common/Section"
import { ArielStatPriorityList } from "../priorities/ArielStatPriorityList"

type ArielSectionProps = {
    classId: string
}

// Everything for Ariel, which spends its own points: the points and its
// stat priorities. Its route and allocated points are in Compare saved
// routes.
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
                Ariel has only stat nodes and spends its own points (Daevanion
                Crystal: Ariel), not the shared total. Optimize all boards also
                builds its route.
            </Text>

            <PointsField
                label="Ariel points"
                value={settings.points}
                onChange={handlePointsChange}
            />

            <Section title="Stat priorities" variant="sub">
                <ArielStatPriorityList classId={classId} />
            </Section>
        </Section>
    )
}
