import { AbsoluteCenter, Text } from "@chakra-ui/react"

type CellLabelProps = {
    label: string
    selected: boolean
    // Over artwork the label gets a dark backing so it stays readable.
    hasImage: boolean
}

export const CellLabel = ({ label, selected, hasImage }: CellLabelProps) => {
    return (
        <AbsoluteCenter asChild>
            <Text
                zIndex="board.label"
                maxW="full"
                bg={label && hasImage ? "board.labelBg" : "transparent"}
                borderRadius="sm"
                color={label && (selected || hasImage) ? "white" : undefined}
                fontSize="xs"
                lineHeight="short"
                textOverflow="ellipsis"
                whiteSpace="normal"
                pointerEvents="none"
            >
                {label}
            </Text>
        </AbsoluteCenter>
    )
}
