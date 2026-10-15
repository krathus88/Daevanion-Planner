import { Flex, Text } from "@chakra-ui/react"
import { SavedListRow, type SavedListItem } from "./SavedListRow"

type SavedListProps = {
    items: SavedListItem[]
    empty: string
    loadLabel?: string
    onLoad: (id: string) => void
    onDelete: (id: string) => void
    // Shows a button on each row that asks for a new name.
    onRename?: (id: string, name: string) => void
    renameLabel?: string
}

export const SavedList = ({
    items,
    empty,
    loadLabel = "Load",
    onLoad,
    onDelete,
    onRename,
    renameLabel = "Rename",
}: SavedListProps) => {
    return items.length === 0 ? (
        <Text textStyle="hint">{empty}</Text>
    ) : (
        <Flex flexDir="column" gap="1.5">
            {items.map((item) => (
                <SavedListRow
                    key={item.id}
                    item={item}
                    loadLabel={loadLabel}
                    onDelete={onDelete}
                    onLoad={onLoad}
                    renameLabel={renameLabel}
                    onRename={onRename}
                />
            ))}
        </Flex>
    )
}
