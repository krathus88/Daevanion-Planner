import type { Tokens } from "@chakra-ui/react"
import type { StatTier } from "@planner/config/stats"
import type { SameRankOrder } from "@planner/storage/rankOrder"

export const STAT_TIER_COLORS: Record<StatTier, Tokens["colors"]> = {
    best: "app.accent",
    good: "app.success",
    okay: "app.info",
    ignore: "app.subtle",
}

// Same scale as the stat tiers: More is the strongest, Less the weakest.
export const SAME_RANK_ORDER_COLORS: Record<SameRankOrder, Tokens["colors"]> = {
    more: "app.accent",
    equal: "app.success",
    less: "app.info",
}
