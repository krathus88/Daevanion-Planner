import { Box } from "@chakra-ui/react"
import { DIAMOND } from "./nodeStyles"

export const SpecialGem = () => {
    return (
        <>
            <Box pos="absolute" inset="0" bgImage="board.gem.sheen" />

            <Box
                pos="absolute"
                inset="0"
                transitionProperty="zoom"
                transitionDuration="fast"
                data-zoom=""
            >
                <Box
                    pos="absolute"
                    inset="board.gemRing"
                    bg="board.gemShade"
                    clipPath={DIAMOND}
                />

                <Box
                    pos="absolute"
                    inset="board.gemFacet"
                    bgImage="board.gem.facet"
                    clipPath={DIAMOND}
                />

                <Box
                    pos="absolute"
                    inset="board.gemCore"
                    bgImage="board.gem.core"
                    boxShadow="board.gem"
                    clipPath={DIAMOND}
                />
            </Box>
        </>
    )
}
