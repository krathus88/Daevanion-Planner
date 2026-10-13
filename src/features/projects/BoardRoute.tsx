import { getRouteApi } from "@tanstack/react-router"
import { Daevanion } from "./Daevanion"

const route = getRouteApi("/$classId/$layout")

export const BoardRoute = () => {
    const { classId, layout } = route.useParams()

    return <Daevanion classId={classId} layout={layout} />
}
