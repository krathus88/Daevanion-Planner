import { Button, Flex, Input, Text } from "@chakra-ui/react"
import { BOARD_IDS, BOARD_NAMES } from "@config/boards"
import { classPresets } from "@config/classPresets"
import { StatusText } from "@common/StatusText"
import {
    encodeSharedPlan,
    readSharedPlan,
    readSharedSettings,
    type SharedPlan,
} from "@planner/share/shareCode"
import { getRouteApi, useRouter } from "@tanstack/react-router"
import { useState, type FocusEvent } from "react"

const route = getRouteApi("/planner/$classId/$layout")

type ShareResult = { url: string; copied: boolean } | { error: string }

// Makes a link to this board's plan, or every board's, with the class's
// optimizer priorities.
export const ShareLinks = () => {
    const { classId, layout: layoutName } = route.useParams()
    const router = useRouter()
    const [result, setResult] = useState<ShareResult | null>(null)

    // The plan for a scope, or why there's nothing to share.
    const readPlan = (
        scope: "board" | "class" | "settings",
    ): SharedPlan | string => {
        if (scope === "settings") {
            try {
                return (
                    readSharedSettings(classId) ??
                    `Your ${classPresets[classId].name} optimizer settings are still the defaults, so there's nothing to share.`
                )
            } catch {
                return "Your optimizer settings couldn't be read."
            }
        }

        return (
            readSharedPlan(
                classId,
                scope === "board" ? [layoutName] : BOARD_IDS,
            ) ??
            (scope === "board"
                ? `${BOARD_NAMES[layoutName]} has no route or picks to share yet.`
                : "No board has a route or picks to share yet.")
        )
    }

    const share = async (scope: "board" | "class" | "settings") => {
        const plan = readPlan(scope)
        if (typeof plan === "string") {
            setResult({ error: plan })
            return
        }

        try {
            const code = await encodeSharedPlan(plan)
            const location = router.buildLocation({
                to: "/planner/$classId/$layout",
                params: { classId: classId, layout: layoutName },
                search: { share: code },
            })
            const url = new URL(
                router.history.createHref(location.href),
                window.location.origin,
            ).href

            let copied = false
            try {
                await navigator.clipboard.writeText(url)
                copied = true
            } catch {
                // Shown below to copy by hand.
            }

            setResult({ url: url, copied: copied })
        } catch {
            setResult({ error: "Could not make a share link." })
        }
    }

    const handleShareBoard = () => {
        void share("board")
    }

    const handleShareClass = () => {
        void share("class")
    }

    const handleShareSettings = () => {
        void share("settings")
    }

    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
        event.target.select()
    }

    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="hint">
                Anyone with the link sees the plan and can save a copy. Board
                links include your optimizer settings; the settings link has
                only those, with no routes or points.
            </Text>

            <Flex flexWrap="wrap" gap="2">
                <Button
                    variant="secondary"
                    size="xs"
                    onClick={handleShareBoard}
                >
                    Link to {BOARD_NAMES[layoutName]}
                </Button>

                <Button
                    variant="secondary"
                    size="xs"
                    onClick={handleShareClass}
                >
                    Link to all boards
                </Button>

                <Button
                    variant="secondary"
                    size="xs"
                    onClick={handleShareSettings}
                >
                    Link to settings only
                </Button>
            </Flex>

            {result &&
                ("error" in result ? (
                    <StatusText>{result.error}</StatusText>
                ) : (
                    <>
                        <Input
                            size="sm"
                            readOnly
                            value={result.url}
                            aria-label="Share link"
                            onFocus={handleFocus}
                        />

                        <StatusText tone="muted">
                            {result.copied
                                ? "Link copied."
                                : "Copy the link above to share it."}
                        </StatusText>
                    </>
                ))}
        </Flex>
    )
}
