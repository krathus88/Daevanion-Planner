import { Image, Text } from "@chakra-ui/react"
import { CLASS_ICONS, CLASS_NAMES } from "@config/classPresets/classInfo"
import { getServer } from "@timers/config/servers"
import { getCharacterName } from "@tracker/logic/characterName"
import type { ResetPeriods } from "@tracker/logic/resetPeriods"
import type { TaskGroup } from "@tracker/logic/trackerCards"
import type { TrackerCharacter, TrackerData } from "@tracker/types"
import { TaskCard } from "./TaskCard"
import type {
    CountChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
} from "./taskHandlers"

type CharacterCardProps = {
    character: TrackerCharacter
    taskGroups: TaskGroup[]
    counts: TrackerData["counts"]
    entries: TrackerData["entries"]
    minimized: string[]
    ignored: TrackerData["ignored"]
    periods: ResetPeriods
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onMinimizedChange: (owner: string, minimized: boolean) => void
    onIgnoredChange: IgnoredChangeHandler
}

export const CharacterCard = ({
    character,
    taskGroups,
    counts,
    entries,
    minimized,
    ignored,
    periods,
    onCountChange,
    onEntriesChange,
    onMinimizedChange,
    onIgnoredChange,
}: CharacterCardProps) => {
    const name = getCharacterName(character)

    return (
        <TaskCard
            title={name}
            owner={character.id}
            ownerLabel={name}
            taskGroups={taskGroups}
            periods={periods}
            counts={counts[character.id]}
            entries={entries[character.id]}
            ignored={ignored[character.id]}
            minimized={minimized.includes(character.id)}
            icon={
                <Image
                    src={CLASS_ICONS[character.classId]}
                    boxSize="8"
                    objectFit="contain"
                    alt=""
                    aria-hidden="true"
                />
            }
            subtitle={
                <Text as="span" textStyle="caption">
                    {CLASS_NAMES[character.classId]} ·{" "}
                    {getServer(character.server).name}
                </Text>
            }
            onCountChange={onCountChange}
            onEntriesChange={onEntriesChange}
            onMinimizedChange={onMinimizedChange}
            onIgnoredChange={onIgnoredChange}
        />
    )
}
