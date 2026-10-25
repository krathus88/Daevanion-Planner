import { NativeSelect } from "@chakra-ui/react"
import { SERVER_FACTIONS, SERVERS } from "@timers/config/servers"
import type { ChangeEvent } from "react"

type ServerSelectProps = {
    value: string
    onChange: (server: string) => void
}

const SERVER_GROUPS = SERVER_FACTIONS.map((faction) => ({
    faction: faction,
    servers: SERVERS.filter((server) => server.faction === faction.id).sort(
        (a, b) => a.name.localeCompare(b.name),
    ),
}))

export const ServerSelect = ({ value, onChange }: ServerSelectProps) => {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        onChange(event.target.value)
    }

    return (
        <NativeSelect.Root size="sm" w="serverSelect" flexShrink="0">
            <NativeSelect.Field
                value={value}
                aria-label="Server"
                onChange={handleChange}
            >
                {SERVER_GROUPS.map((group) => (
                    <optgroup
                        key={group.faction.id}
                        label={group.faction.label}
                    >
                        {group.servers.map((server) => (
                            <option key={server.id} value={server.id}>
                                {server.name}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </NativeSelect.Field>

            <NativeSelect.Indicator />
        </NativeSelect.Root>
    )
}
