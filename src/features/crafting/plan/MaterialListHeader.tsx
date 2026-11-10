import { Grid, Text } from "@chakra-ui/react"
import { MATERIAL_COLUMNS } from "./materialColumns"

// Column names, once above the rows.
export const MaterialListHeader = () => {
    return (
        <Grid px="3" {...MATERIAL_COLUMNS}>
            <Text gridArea="name" textStyle="caption">
                Item
            </Text>

            <Text gridArea="have" textStyle="caption" textAlign="right">
                Have / need
            </Text>

            <Text gridArea="bag" textStyle="caption" textAlign="right">
                In the bag
            </Text>

            <Text gridArea="price" textStyle="caption" textAlign="right">
                Price each
            </Text>

            <Text gridArea="kinah" textStyle="caption" textAlign="right">
                To spend
            </Text>
        </Grid>
    )
}
