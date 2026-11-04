import type { TrackerCharacter, TrackerTask } from "@tracker/types"

// Counts of a server's shared tasks are kept under this.
export const getServerOwner = (server: string) => {
    return `server:${server}`
}

// Whose count a character's task uses: its own, or its server's for a
// shared task, so every character on that server shares one.
export const getTaskOwner = (
    task: TrackerTask,
    character: TrackerCharacter,
) => {
    return task.shared ? getServerOwner(character.server) : character.id
}
