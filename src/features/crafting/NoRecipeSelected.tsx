import { Text } from "@chakra-ui/react"
import { Card } from "@common/Card"

export const NoRecipeSelected = () => {
    return (
        <Card py="10" alignItems="center" textAlign="center">
            <Text textStyle="label">Pick a recipe</Text>

            <Text maxW="md" textStyle="hint">
                Choose an item from the list to see every craft along the way,
                the materials to gather or buy, and what it costs.
            </Text>
        </Card>
    )
}
