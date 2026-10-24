import { Button } from "@chakra-ui/react"
import type { BoardId } from "@config/boards"
import type { ClassId } from "@config/classPresets"
import { Link as RouterLink } from "@tanstack/react-router"

type BackToMyPlansLinkProps = {
    classId: ClassId
    layout: BoardId
}

export const BackToMyPlansLink = ({
    classId,
    layout,
}: BackToMyPlansLinkProps) => {
    return (
        <Button asChild variant="secondary" size="sm">
            <RouterLink
                params={{ classId: classId, layout: layout }}
                to="/planner/$classId/$layout"
                search={{}}
            >
                Back to my plans
            </RouterLink>
        </Button>
    )
}
