import { HiddenCubeKey } from "@assets/tracker"
import { Box, Button, Flex } from "@chakra-ui/react"
import { IconImage } from "@common/IconImage"
import { WholeNumberInput } from "@common/WholeNumberInput"
import { Tooltip } from "@ui/tooltip"
import { useIsWrapped } from "@tracker/hooks/useIsWrapped"
import { useRef, useState, type ChangeEvent } from "react"
import { CompanionLocked, CompanionLockIcon } from "@account/CompanionLocked"

type HiddenCubeKeysRowProps = {
    // Missing until set by hand or by the companion app.
    count?: number
    ownerLabel: string
    // Filled by the companion app: no edits.
    locked?: boolean
    onChange: (count: number) => void
}

// Beside Odyle Energy: the Hidden Cube keys in the character's inventory, as
// the key's icon and the count. Clicking the count edits it until focus
// leaves the field. Locked, its lock goes before the icon while the row sits
// right-aligned beside Odyle Energy, after the count once it wraps below.
export const HiddenCubeKeysRow = ({
    count,
    ownerLabel,
    locked = false,
    onChange,
}: HiddenCubeKeysRowProps) => {
    const [editing, setEditing] = useState(false)
    const rowRef = useRef<HTMLDivElement>(null)
    const wrapped = useIsWrapped(rowRef, locked)

    const handleEdit = () => {
        setEditing(true)
    }

    const handleBlur = () => {
        setEditing(false)
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(Number(event.target.value || "0"))
    }

    const label = `Hidden Cube keys, ${ownerLabel}`

    return (
        <Flex ref={rowRef} className="group" alignItems="center" gap="1">
            {locked && !wrapped && <CompanionLockIcon />}

            <Tooltip content="Hidden Cube keys" openDelay={300}>
                <Box flexShrink="0">
                    <IconImage icon={HiddenCubeKey} />
                </Box>
            </Tooltip>

            {editing ? (
                <WholeNumberInput
                    size="xs"
                    h="6"
                    w="12"
                    px="1"
                    textAlign="center"
                    value={String(count ?? 0)}
                    autoFocus
                    aria-label={label}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />
            ) : (
                <CompanionLocked locked={locked} side="outside">
                    <Tooltip content="Click to edit" openDelay={300}>
                        <Button
                            variant="ghost"
                            size="xs"
                            h="6"
                            minW="0"
                            px="1"
                            color={count === undefined ? "app.muted" : "app.fg"}
                            fontSize="sm"
                            fontWeight="normal"
                            aria-label={`${label}: ${count ?? "not set"}, edit`}
                            onClick={handleEdit}
                        >
                            {count ?? "—"}
                        </Button>
                    </Tooltip>
                </CompanionLocked>
            )}

            {locked && wrapped && <CompanionLockIcon />}
        </Flex>
    )
}
