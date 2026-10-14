import { Image } from "@chakra-ui/react"

type IconImageProps = {
    icon?: string
    size?: "4" | "5"
}

export const IconImage = ({ icon, size = "5" }: IconImageProps) => {
    return icon ? (
        <Image
            src={icon}
            boxSize={size}
            flexShrink="0"
            objectFit="contain"
            alt=""
            aria-hidden="true"
        />
    ) : null
}
