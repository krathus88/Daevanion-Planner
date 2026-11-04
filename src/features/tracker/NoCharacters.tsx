import { Button, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { LuUserPlus } from "react-icons/lu"

type NoCharactersProps = {
    onAdd: () => void
}

export const NoCharacters = ({ onAdd }: NoCharactersProps) => {
    return (
        <Card py="10" alignItems="center" textAlign="center">
            <Text fontWeight="semibold">No characters yet</Text>

            <Text textStyle="hint" maxW="md">
                Add your characters to get a column each, with the daily and
                weekly tasks to tick off.
            </Text>

            <Button variant="primary" size="sm" onClick={onAdd}>
                <LuUserPlus />
                Add a character
            </Button>
        </Card>
    )
}
