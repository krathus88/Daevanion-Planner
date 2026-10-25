import { LevelBadge } from "./LevelBadge"

type LevelBadgeListProps = {
    levels: number[]
}

export const LevelBadgeList = ({ levels }: LevelBadgeListProps) => {
    return levels.map((level) => <LevelBadge key={level} level={level} />)
}
