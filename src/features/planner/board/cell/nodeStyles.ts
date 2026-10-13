import type { ClassAbility } from "@config/classPresets"
import type { SystemStyleObject, Tokens } from "@chakra-ui/react"
import type { BoardNodeAppearance } from "@planner/config/layouts"

type ColorToken = Tokens["colors"]
type ShadowToken = Tokens["shadows"]
type SizeToken = Tokens["sizes"]

export const DIAMOND = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"

// Every cell takes the same square; the node drawn inside varies in size.
export const CELL_BOX = "14"
const BASIC_SIZE = "node.stat"
const SPECIAL_SIZE = "node.special"
export const START_SIZE = "node.start"

type NodeStyleInput = {
    appearance: BoardNodeAppearance
    ability?: ClassAbility
    selected: boolean
    adjacentAvailable: boolean
    targeted: boolean
    canSelect: boolean
}

// Size, fill, border and glow for a node, from its type and state.
export const getNodeStyles = ({
    appearance,
    ability,
    selected,
    adjacentAvailable,
    targeted,
    canSelect,
}: NodeStyleInput) => {
    const isBasic = appearance.type === "basic"
    const isSpecial = appearance.type === "special"
    const size: SizeToken = isBasic
        ? BASIC_SIZE
        : isSpecial
          ? SPECIAL_SIZE
          : CELL_BOX
    const fill: ColorToken = isBasic
        ? selected
            ? "board.statSelected"
            : "board.stat"
        : isSpecial
          ? "transparent"
          : appearance.backgroundColor
    const borderColor: ColorToken = targeted
        ? "board.target"
        : selected
          ? "board.selected"
          : ability
            ? ability.type === "passive"
                ? "board.passive"
                : "board.skill"
            : adjacentAvailable
              ? "board.adjacent"
              : isBasic
                ? "board.statBorder"
                : isSpecial
                  ? "board.special"
                  : "board.idleBorder"
    const shadow: ShadowToken =
        selected && ability
            ? "board.node.selectedAbility"
            : selected && !isSpecial
              ? "board.node.selected"
              : adjacentAvailable && !isSpecial
                ? "board.node.adjacent"
                : "none"

    // Hovering zooms the artwork inside the frame instead of growing the
    // node. Stat nodes have no artwork, so they light up instead.
    const hoverCss: SystemStyleObject | undefined = canSelect
        ? {
              _hover: {
                  "& [data-zoom]": {
                      transform: "scale(1.15)",
                      filter: "brightness(1.12)",
                  },
                  ...(isBasic && {
                      "& [data-shape]": {
                          bg: selected
                              ? "board.statSelected"
                              : "board.statHover",
                          boxShadow:
                              shadow === "board.node.selected"
                                  ? "board.node.selectedHover"
                                  : shadow === "board.node.adjacent"
                                    ? "board.node.adjacentHover"
                                    : "board.node.hover",
                      },
                  }),
              },
              _motionReduce: {
                  "& [data-zoom]": { transitionProperty: "none" },
              },
          }
        : undefined

    return {
        isBasic: isBasic,
        isSpecial: isSpecial,
        size: size,
        fill: fill,
        borderColor: borderColor,
        borderWidth: isSpecial
            ? "0"
            : selected || adjacentAvailable || targeted
              ? "3px"
              : "1px",
        borderRadius: isBasic ? "full" : "sm",
        clipPath: isSpecial ? DIAMOND : undefined,
        shadow: shadow,
        hoverCss: hoverCss,
    } as const
}
