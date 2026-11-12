import { Box, Flex, Icon } from "@chakra-ui/react"
import { HOVER_REVEAL } from "@common/hoverReveal"
import { Tooltip } from "@ui/tooltip"
import type { ReactNode } from "react"
import { LuLock } from "react-icons/lu"

const LOCKED_TEXT = "Filled by the companion app"

// The lock itself: shown on hover of a `group` ancestor (always on touch
// screens), keeping its place so nothing moves.
const LockIcon = () => {
    return (
        <Flex role="img" aria-label={LOCKED_TEXT} _canHover={HOVER_REVEAL}>
            <Icon boxSize="3" color="app.muted">
                <LuLock />
            </Icon>
        </Flex>
    )
}

// The lock on its own, for a row that places it away from the value (Hidden
// Cube keys: before their icon).
export const CompanionLockIcon = () => {
    return (
        <Tooltip content={LOCKED_TEXT} openDelay={300}>
            <LockIcon />
        </Tooltip>
    )
}

type CompanionLockedProps = {
    locked: boolean
    // Where the lock goes: "end" where the left has no room (Odyle Energy's
    // total, right after its icon); "outside" when the caller draws
    // CompanionLockIcon itself.
    side?: "start" | "end" | "outside"
    children: ReactNode
}

// A control the companion app fills (tracker, pets, crafting bag counts):
// takes no input (inert) while it runs.
export const CompanionLocked = ({
    locked,
    side = "start",
    children,
}: CompanionLockedProps) => {
    if (!locked) {
        return children
    }

    return (
        <Tooltip content={LOCKED_TEXT} openDelay={300}>
            <Flex
                className="group"
                flexDir={side === "end" ? "row-reverse" : "row"}
                alignItems="center"
                gap="1"
            >
                {side !== "outside" && <LockIcon />}

                <Box inert>{children}</Box>
            </Flex>
        </Tooltip>
    )
}
