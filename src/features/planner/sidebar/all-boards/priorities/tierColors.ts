import type { Tokens } from "@chakra-ui/react"
import type { StatTier } from "@planner/config/stats"

export const STAT_TIER_COLORS: Record<StatTier, Tokens["colors"]> = {
    best: "app.accent",
    good: "app.success",
    okay: "app.info",
    ignore: "app.subtle",
}
