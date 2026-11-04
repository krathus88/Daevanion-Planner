import type { TaskFields } from "@tracker/logic/trackerEdits"
import type { TrackerTask } from "@tracker/types"
import { TaskEditRow } from "./TaskEditRow"

type TaskEditListProps = {
    tasks: TrackerTask[]
    onChange: (id: string, fields: TaskFields) => void
    onDelete: (id: string) => void
    onMove: (id: string, offset: -1 | 1) => void
}

export const TaskEditList = ({
    tasks,
    onChange,
    onDelete,
    onMove,
}: TaskEditListProps) => {
    return tasks.map((task, index) => (
        <TaskEditRow
            key={task.id}
            task={task}
            first={index === 0}
            last={index === tasks.length - 1}
            onChange={onChange}
            onDelete={onDelete}
            onMove={onMove}
        />
    ))
}
