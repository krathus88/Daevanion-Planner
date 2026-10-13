import { Image } from "@chakra-ui/react"

export const IconImage = ({ icon }: { icon?: string }) => {
    return icon ? (
        <Image
            src={icon}
            boxSize="5"
            flexShrink="0"
            objectFit="contain"
            alt=""
            aria-hidden="true"
        />
    ) : null
}
