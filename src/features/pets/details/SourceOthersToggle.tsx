import { chakra, Icon } from "@chakra-ui/react"
import { LuMapPin } from "react-icons/lu"

type SourceOthersToggleProps = {
    // Their pins are on the map.
    active: boolean
    onClick: () => void
}

// "Also here" as a chip: shows the spot with the other pets' pins too.
export const SourceOthersToggle = ({
    active,
    onClick,
}: SourceOthersToggleProps) => {
    return (
        <chakra.button
            mr="1"
            px="2"
            py="0.5"
            display="flex"
            alignItems="center"
            gap="1"
            bg={active ? "app.accentMuted" : "transparent"}
            borderWidth="1px"
            borderColor={active ? "app.accent" : "app.border"}
            borderRadius="full"
            color={active ? "app.accentHover" : "app.muted"}
            fontSize="xs"
            fontWeight="medium"
            cursor="button"
            _hover={{ color: "app.accentHover", borderColor: "app.accent" }}
            type="button"
            aria-pressed={active}
            title="Show these pets' pins on the map too"
            onClick={onClick}
        >
            <Icon boxSize="3">
                <LuMapPin />
            </Icon>
            Also here
        </chakra.button>
    )
}
