import { Button, Flex, Input, Text } from "@chakra-ui/react"
import {
    useState,
    type ChangeEvent,
    type FormEvent,
    type KeyboardEvent,
} from "react"

export type SavedListItem = {
    id: string
    name: string
    detail?: string
    active?: boolean
}

type SavedListRowProps = {
    item: SavedListItem
    loadLabel: string
    onLoad: (id: string) => void
    onDelete: (id: string) => void
    onRename?: (id: string, name: string) => void
    renameLabel?: string
}

export const SavedListRow = ({
    item,
    loadLabel,
    onLoad,
    onDelete,
    onRename,
    renameLabel = "Rename",
}: SavedListRowProps) => {
    const [draft, setDraft] = useState<string | null>(null)

    const handleLoad = () => {
        onLoad(item.id)
    }

    const handleDelete = () => {
        onDelete(item.id)
    }

    const handleStartRename = () => {
        setDraft(item.name)
    }

    const handleDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
        setDraft(event.target.value)
    }

    const handleCancelRename = () => {
        setDraft(null)
    }

    const handleRename = (event: FormEvent<HTMLDivElement>) => {
        event.preventDefault()
        const name = draft?.trim()
        if (!name) {
            return
        }

        if (name !== item.name) {
            onRename?.(item.id, name)
        }

        setDraft(null)
    }

    const handleDraftKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
            setDraft(null)
        }
    }

    if (draft !== null) {
        return (
            <Flex
                as="form"
                px="3"
                py="2"
                minW="0"
                alignItems="center"
                gap="1.5"
                layerStyle={item.active ? "listItemActive" : "listItem"}
                onSubmit={handleRename}
            >
                <Input
                    size="xs"
                    minW="0"
                    flex="1"
                    value={draft}
                    autoFocus
                    aria-label={`New name for ${item.name}`}
                    onChange={handleDraftChange}
                    onKeyDown={handleDraftKeyDown}
                />

                <Button
                    variant="secondary"
                    size="xs"
                    flexShrink="0"
                    type="submit"
                    disabled={!draft.trim()}
                >
                    Save
                </Button>

                <Button
                    variant="ghost"
                    size="xs"
                    flexShrink="0"
                    onClick={handleCancelRename}
                >
                    Cancel
                </Button>
            </Flex>
        )
    }

    return (
        <Flex
            px="3"
            py="2"
            minW="0"
            alignItems="center"
            gap="2"
            layerStyle={item.active ? "listItemActive" : "listItem"}
        >
            <Flex minW="0" flex="1" flexDir="column">
                <Text fontSize="sm" fontWeight="medium" truncate>
                    {item.name}
                </Text>

                {item.detail && <Text textStyle="caption">{item.detail}</Text>}
            </Flex>

            <Flex flexShrink="0" gap="1.5">
                <Button variant="secondary" size="xs" onClick={handleLoad}>
                    {item.active ? "Reload" : loadLabel}
                </Button>

                {onRename && (
                    <Button
                        variant="ghost"
                        size="xs"
                        aria-label={`${renameLabel} ${item.name}`}
                        onClick={handleStartRename}
                    >
                        {renameLabel}
                    </Button>
                )}

                <Button
                    variant="dangerGhost"
                    size="xs"
                    aria-label={`Delete ${item.name}`}
                    onClick={handleDelete}
                >
                    Delete
                </Button>
            </Flex>
        </Flex>
    )
}
