import type { GridProps } from "@chakra-ui/react"

// The materials table's columns, shared by its header and rows: one line from
// sm (long names wrap), two on phones (name and have/need, then Kinah and the
// fields).
export const MATERIAL_COLUMNS: GridProps = {
    templateColumns: {
        base: "minmax(0, 1fr) 4.5rem 5rem",
        // Fixed widths: the header is a grid of its own and must line up.
        sm: "minmax(0, 1fr) 5rem 4rem 5rem 5rem",
    },
    templateAreas: {
        base: `"name name have" "kinah bag price"`,
        sm: `"name have bag price kinah"`,
    },
    alignItems: "center",
    columnGap: "3",
    rowGap: "1.5",
}
