import { Button, Flex, Text } from "@chakra-ui/react"

export type SavedListItem = {
    id: string
    name: string
    detail?: string
    // The entry currently loaded on the board.
    active?: boolean
}

type SavedListRowProps = {
    item: SavedListItem
    loadLabel: string
    onLoad: (id: string) => void
    onDelete: (id: string) => void
}

export const SavedListRow = ({
    item,
    loadLabel,
    onLoad,
    onDelete,
}: SavedListRowProps) => {
    const handleLoad = () => {
        onLoad(item.id)
    }

    const handleDelete = () => {
        onDelete(item.id)
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
