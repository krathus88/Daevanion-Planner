import { IconButton } from "@chakra-ui/react"
import type { TimerId } from "@timers/config/timers"
import { useTimerSettings } from "@timers/hooks/useTimerSettings"
import { Tooltip } from "@ui/tooltip"
import { LuListMinus, LuListPlus } from "react-icons/lu"

type ComingNextButtonProps = {
    id: TimerId
    included: boolean
    name: string
}

export const ComingNextButton = ({
    id,
    included,
    name,
}: ComingNextButtonProps) => {
    const { changeComingNext } = useTimerSettings()

    const handleClick = () => {
        changeComingNext(id, !included)
    }

    const label = included
        ? `Remove ${name} from Coming next`
        : `Add ${name} to Coming next`

    return (
        <Tooltip content={label} openDelay={100} showArrow>
            <IconButton
                variant={included ? "secondary" : "ghost"}
                size="xs"
                color={included ? "app.accent" : undefined}
                aria-label={label}
                aria-pressed={included}
                onClick={handleClick}
            >
                {included ? <LuListMinus /> : <LuListPlus />}
            </IconButton>
        </Tooltip>
    )
}
