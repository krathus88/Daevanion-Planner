import { Flex, Text } from "@chakra-ui/react"
import type { TransferCombo } from "@crafting/logic/transferCombo"
import { formatCount } from "@crafting/logic/formatKinah"
import { ItemIcon } from "@crafting/ItemIcon"

type TransferComboMaterialsProps = {
    materials: TransferCombo["materials"]
}

// "6× Enhanced Hard Balaur Scale", one chip per material.
export const TransferComboMaterials = ({
    materials,
}: TransferComboMaterialsProps) => {
    return (
        <Flex flexWrap="wrap" columnGap="4" rowGap="1">
            {materials.map((material) => (
                <Flex
                    key={material.item.id}
                    alignItems="center"
                    gap="1.5"
                    fontSize="xs"
                >
                    <ItemIcon item={material.item} size="5" />

                    <Text color="app.muted">
                        {formatCount(material.count)}×{" "}
                        <Text
                            as="span"
                            color={
                                material.item.grade
                                    ? `grade.${material.item.grade}`
                                    : "app.fg"
                            }
                        >
                            {material.item.name}
                        </Text>
                    </Text>
                </Flex>
            ))}
        </Flex>
    )
}
