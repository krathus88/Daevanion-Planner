import { Flex, Link, Text } from "@chakra-ui/react"
import { GlowDot } from "@common/GlowDot"
import type { CompanionStatus } from "@account/game/companionStatus"

type CompanionNoteProps = {
    status: CompanionStatus
}

export const COMPANION_DOWNLOAD =
    "https://github.com/krathus88/Daevanion-Planner/releases/latest"

// In a page's header (Tracker: beside its buttons), for logged-in users: whether the companion app is
// filling the page in from the game, or a reminder to start it.
export const CompanionNote = ({ status }: CompanionNoteProps) => {
    if (status.state === "unknown") {
        return null
    }

    if (status.state === "running") {
        return (
            <Flex alignItems="center" gap="2">
                <GlowDot tone="success" />

                <Text textStyle="hint" color="app.success">
                    Companion app connected
                    {status.character && ` · playing ${status.character.name}`}
                </Text>
            </Flex>
        )
    }

    return (
        <Text textStyle="hint">
            Start the companion app to fill this in from the game.{" "}
            <Link
                href={COMPANION_DOWNLOAD}
                color="app.muted"
                target="_blank"
                rel="noreferrer"
            >
                Get it
            </Link>
        </Text>
    )
}
