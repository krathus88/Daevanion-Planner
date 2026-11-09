import { Text } from "@chakra-ui/react"
import { ARIEL_PLAIN_STATS, ARIEL_SPECIAL_STATS } from "@config/stats/stats"
import { NeedMarker } from "@planner/board/cell/NeedMarker"
import { PreferMarker } from "@planner/board/cell/PreferMarker"
import { Section } from "@common/Section"
import { Term } from "@common/Term"
import { ArielStatPriorityList } from "./ArielStatPriorityList"

type ArielPrioritiesProps = {
    classId: string
}

export const ArielPriorities = ({ classId }: ArielPrioritiesProps) => {
    return (
        <>
            <Text textStyle="hint">
                Goes tier by tier: <Term>Best</Term>, then <Term>Good</Term>,
                then <Term>Okay</Term>. Within a tier, special nodes come first,
                then the most stats for the fewest points. A combined node
                counts for both of its stats. On the board, <Term>Best</Term>{" "}
                shows <NeedMarker inline /> and <Term>Good</Term>{" "}
                <PreferMarker inline />.
            </Text>

            <Section title="Special nodes" variant="sub">
                <ArielStatPriorityList
                    classId={classId}
                    stats={ARIEL_SPECIAL_STATS}
                />
            </Section>

            <Section title="Stats" variant="sub">
                <ArielStatPriorityList
                    classId={classId}
                    stats={ARIEL_PLAIN_STATS}
                />
            </Section>
        </>
    )
}
