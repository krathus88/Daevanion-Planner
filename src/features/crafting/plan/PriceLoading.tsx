import { Flex, Skeleton, Text, type FlexProps } from "@chakra-ui/react"

type PriceLoadingProps = FlexProps & {
    // A field's label, above the placeholder (for labelled fields).
    label?: string
}

// Where a price field goes while its market price loads.
export const PriceLoading = ({ label, ...props }: PriceLoadingProps) => {
    return (
        <Flex
            flexDir="column"
            alignItems={label ? "flex-start" : "flex-end"}
            gap="0.5"
            aria-label="Loading the market price"
            aria-busy
            {...props}
        >
            {label && <Text textStyle="caption">{label}</Text>}

            <Skeleton w="full" h="6" borderRadius="sm" />
        </Flex>
    )
}
