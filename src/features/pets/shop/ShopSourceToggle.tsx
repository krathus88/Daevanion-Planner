import { chakra } from "@chakra-ui/react"
import { getShopSourceName, type ShopSourceId } from "@pets/logic/shopFilters"

type ShopSourceToggleProps = {
    source: ShopSourceId
    picked: boolean
    count: number
    onChange: (source: ShopSourceId, picked: boolean) => void
}

// One chip of the shop's source multi-select, with how many pets worth buying
// it covers.
export const ShopSourceToggle = ({
    source,
    picked,
    count,
    onChange,
}: ShopSourceToggleProps) => {
    const handleClick = () => {
        onChange(source, !picked)
    }

    return (
        <chakra.button
            px="2.5"
            py="0.5"
            display="flex"
            alignItems="center"
            gap="1.5"
            bg={picked ? "app.hover" : "transparent"}
            borderWidth="1px"
            borderColor={picked ? "app.accent" : "app.border"}
            borderRadius="full"
            color={picked ? "app.fg" : "app.muted"}
            fontSize="xs"
            fontWeight="medium"
            cursor="button"
            _hover={{ color: "app.fg", borderColor: "app.accent" }}
            _disabled={{
                opacity: "disabled",
                cursor: "disabled",
                _hover: { color: "app.muted", borderColor: "app.border" },
            }}
            type="button"
            disabled={count === 0 && !picked}
            aria-pressed={picked}
            onClick={handleClick}
        >
            {getShopSourceName(source)} ({count})
        </chakra.button>
    )
}
