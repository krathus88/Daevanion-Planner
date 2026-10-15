import { Container, Text } from "@chakra-ui/react"
import type { BoardId } from "@config/boards"
import { classPresets, type ClassId } from "@config/classPresets"
import { Card } from "@common/Card"
import { useEffect, useState, type ReactNode } from "react"
import { useClassDocumentMeta } from "@planner/hooks/useClassDocumentMeta"
import { BackToMyPlansLink } from "./BackToMyPlansLink"
import { decodeSharedPlan, type SharedPlan } from "./shareCode"
import { SharedPlanWorkspace } from "./SharedPlanWorkspace"
import { SharedSettingsContext } from "./sharedSettingsContext"

type SharedPlanPageProps = {
    classId: ClassId
    layout: BoardId
    code: string
    // The viewer's own planner, shown under a settings-only link.
    ownPlanner: ReactNode
}

// A plan opened from a share link. Nothing is written until it's saved.
export const SharedPlanPage = ({
    classId,
    layout,
    code,
    ownPlanner,
}: SharedPlanPageProps) => {
    useClassDocumentMeta(classPresets[classId])

    const linkKey = `${classId}:${code}`
    const [decoded, setDecoded] = useState<{
        linkKey: string
        result: SharedPlan | string
    } | null>(null)

    useEffect(() => {
        let isCurrent = true
        decodeSharedPlan(code, classId).then((result) => {
            if (isCurrent) {
                setDecoded({ linkKey: linkKey, result: result })
            }
        })

        return () => {
            isCurrent = false
        }
    }, [classId, code, linkKey])

    const result = decoded?.linkKey === linkKey ? decoded.result : null

    // Settings only: the viewer's own board, with the settings in the
    // sidebar.
    if (
        result !== null &&
        typeof result !== "string" &&
        Object.keys(result.boards).length === 0
    ) {
        return (
            <SharedSettingsContext value={result}>
                {ownPlanner}
            </SharedSettingsContext>
        )
    }

    return (
        <Container as="main" py={{ base: "4", md: "6" }} maxW="8xl" flex="1">
            {result === null ? (
                <Text color="app.muted">Opening shared plan…</Text>
            ) : typeof result === "string" ? (
                <Card maxW="md" mx="auto">
                    <Text>{result}</Text>

                    <BackToMyPlansLink classId={classId} layout={layout} />
                </Card>
            ) : (
                <SharedPlanWorkspace
                    // Saving starts over for each link.
                    key={linkKey}
                    layout={layout}
                    plan={result}
                />
            )}
        </Container>
    )
}
