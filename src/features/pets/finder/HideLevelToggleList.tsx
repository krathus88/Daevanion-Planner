import { PET_LEVELS } from "@pets/logic/petLevels"
import { HideLevelToggle } from "./HideLevelToggle"

type HideLevelToggleListProps = {
    hiddenLevels: number[]
    onChange: (level: number, hidden: boolean) => void
}

export const HideLevelToggleList = ({
    hiddenLevels,
    onChange,
}: HideLevelToggleListProps) => {
    return PET_LEVELS.map((level) => (
        <HideLevelToggle
            key={level}
            level={level}
            hidden={hiddenLevels.includes(level)}
            onChange={onChange}
        />
    ))
}
