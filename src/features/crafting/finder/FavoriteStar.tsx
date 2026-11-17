import { chakra } from "@chakra-ui/react"
import { LuStar } from "react-icons/lu"

type FavoriteStarProps = {
    favorite: boolean
    // What it stars, for screen readers: "Mace".
    label: string
    onChange: (favorite: boolean) => void
}

// A section heading's star: faint until the heading is hovered, gold once
// starred.
export const FavoriteStar = ({
    favorite,
    label,
    onChange,
}: FavoriteStarProps) => {
    const handleClick = () => {
        onChange(!favorite)
    }

    return (
        <chakra.button
            boxSize="5"
            flexShrink="0"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="sm"
            color={favorite ? "app.accent" : "app.subtle"}
            cursor="button"
            _hover={{ color: "app.accent" }}
            _groupHover={favorite ? undefined : { color: "app.muted" }}
            type="button"
            aria-label={`Favorite ${label}`}
            aria-pressed={favorite}
            title={favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={handleClick}
        >
            <LuStar size={12} fill={favorite ? "currentColor" : "none"} />
        </chakra.button>
    )
}
