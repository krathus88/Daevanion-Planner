import type { SystemStyleObject } from "@chakra-ui/react"

export const markerOnCell: SystemStyleObject = {
    display: "block",
    position: "absolute",
    top: "board.markerInset",
    right: "board.markerInset",
    zIndex: "board.marker",
}

// Same marker drawn inside a line of text, e.g. sidebar hints.
export const markerInline: SystemStyleObject = {
    display: "inline-block",
    verticalAlign: "-0.125em",
    marginX: "0.5",
}
