import type { TaskFields } from "@tracker/logic/trackerEdits"
import type { TrackerTask } from "@tracker/types"
import { SortableList } from "./SortableList"
import { TaskEditRow } from "./TaskEditRow"

type TaskEditListProps = {
    tasks: TrackerTask[]
    onChange: (id: string, fields: TaskFields) => void
    onDelete: (id: string) => void
    onMove: (id: string, targetId: string) => void
}

export const TaskEditList = ({
    tasks,
    onChange,
    onDelete,
    onMove,
}: TaskEditListProps) => {
    return (
        <SortableList ids={tasks.map((task) => task.id)} onMove={onMove}>
            {tasks.map((task, index) => (
                <TaskEditRow
                    key={task.id}
                    task={task}
                    index={index}
                    onChange={onChange}
                    onDelete={onDelete}
                />
            ))}
        </SortableList>
    )
}
