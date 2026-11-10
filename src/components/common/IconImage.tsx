import { Image } from "@chakra-ui/react"

type IconImageProps = {
    icon?: string
    size?: "4" | "5"
    // A soft glow around the icon's outline, in this color token.
    glow?: string
}

export const IconImage = ({ icon, size = "5", glow }: IconImageProps) => {
    return icon ? (
        <Image
            src={icon}
            boxSize={size}
            flexShrink="0"
            objectFit="contain"
            filter={glow ? `drop-shadow(0 0 3px {colors.${glow}})` : undefined}
            alt=""
            aria-hidden="true"
        />
    ) : null
}
