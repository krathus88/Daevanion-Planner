import { Text } from "@chakra-ui/react"
import type { StatBoardId } from "@config/boards"
import {
    ARIEL_PLAIN_STATS,
    ARIEL_SPECIAL_STATS,
    AZPHEL_PLAIN_STATS,
    AZPHEL_SPECIAL_STATS,
    type StatBoardStat,
} from "@config/stats/stats"
import { NeedMarker } from "@planner/board/cell/NeedMarker"
import { PreferMarker } from "@planner/board/cell/PreferMarker"
import { Section } from "@common/Section"
import { Term } from "@common/Term"
import { StatBoardRankOrderList } from "./StatBoardRankOrderList"
import { StatBoardStatList } from "./StatBoardStatList"

const BOARD_STATS: Record<
    StatBoardId,
    { special: readonly StatBoardStat[]; plain: readonly StatBoardStat[] }
> = {
    ariel: { special: ARIEL_SPECIAL_STATS, plain: ARIEL_PLAIN_STATS },
    azphel: { special: AZPHEL_SPECIAL_STATS, plain: AZPHEL_PLAIN_STATS },
}

type StatBoardPrioritiesProps = {
    classId: string
    board: StatBoardId
}

// Ariel's or Azphel's stat tiers and same-rank order.
export const StatBoardPriorities = ({
    classId,
    board,
}: StatBoardPrioritiesProps) => {
    return (
        <>
            <Text textStyle="hint">
                Goes tier by tier: <Term>Best</Term>, then <Term>Good</Term>,
                then <Term>Okay</Term>. Within a tier, the{" "}
                <Term>Same-rank order</Term> decides what comes first. A
                combined node counts for both of its stats. Click a name to
                ignore it; hover it to find its nodes. On the board,{" "}
                <Term>Best</Term> shows <NeedMarker inline /> and{" "}
                <Term>Good</Term> <PreferMarker inline />.
            </Text>

            <Section title="Special nodes" variant="sub">
                <StatBoardStatList
                    classId={classId}
                    board={board}
                    stats={BOARD_STATS[board].special}
                />
            </Section>

            <Section title="Stats" variant="sub">
                <StatBoardStatList
                    classId={classId}
                    board={board}
                    stats={BOARD_STATS[board].plain}
                />
            </Section>

            <Section title="Same-rank order" variant="sub">
                <StatBoardRankOrderList classId={classId} board={board} />
            </Section>
        </>
    )
}
