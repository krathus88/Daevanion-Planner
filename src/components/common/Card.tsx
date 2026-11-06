import { Flex, type FlexProps } from "@chakra-ui/react"
import type { Ref } from "react"

type CardProps = FlexProps & {
    ref?: Ref<HTMLDivElement>
}

export const Card = ({ ...props }: CardProps) => {
    return <Flex p="4" flexDir="column" gap="3" layerStyle="card" {...props} />
}
