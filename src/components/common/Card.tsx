import { Flex, type FlexProps } from "@chakra-ui/react"

export const Card = ({ ...props }: FlexProps) => {
    return <Flex p="4" flexDir="column" gap="3" layerStyle="card" {...props} />
}
