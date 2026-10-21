import type { ClassAbility } from "@config/classPresets"
import type { SystemStyleObject, Tokens } from "@chakra-ui/react"
import type { BoardNodeAppearance, StatNodeTone } from "@planner/config/layouts"

type ColorToken = Tokens["colors"]
type ShadowToken = Tokens["shadows"]
type GradientToken = Tokens["gradients"]
type SizeToken = Tokens["sizes"]

export const DIAMOND = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"

// Every cell takes the same square; the node drawn inside varies in size.
export const CELL_BOX = "14"
const BASIC_SIZE = "node.stat"
const SPECIAL_SIZE = "node.special"
export const START_SIZE = "node.start"

// Toned stat nodes are faceted gems in the skill or passive colour, lit up
// when selected and drawn larger the more they cost.
const TONE_STYLES: Record<
    StatNodeTone,
    {
        size: SizeToken
        solid: ColorToken
        tint: ColorToken
        orb: GradientToken
        orbLit: GradientToken
    }
> = {
    skill: {
        size: "node.statSkill",
        solid: "board.skill",
        tint: "board.skillTint",
        orb: "board.orb.skill",
        orbLit: "board.orb.skillLit",
    },
    passive: {
        size: "node.statPassive",
        solid: "board.passive",
        tint: "board.passiveTint",
        orb: "board.orb.passive",
        orbLit: "board.orb.passiveLit",
    },
}

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
    const tone =
        isBasic && appearance.tone ? TONE_STYLES[appearance.tone] : null
    const size: SizeToken = isBasic
        ? (tone?.size ?? BASIC_SIZE)
        : isSpecial
          ? SPECIAL_SIZE
          : CELL_BOX
    const fill: ColorToken = isBasic
        ? selected
            ? (tone?.solid ?? "board.statSelected")
            : (tone?.tint ?? "board.stat")
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
                ? (tone?.solid ?? "board.statBorder")
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
                  // Gems keep their facets and brighten instead.
                  ...(tone && {
                      "& [data-shape]": { filter: "brightness(1.25)" },
                  }),
                  ...(isBasic &&
                      !tone && {
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
        orb: tone ? (selected ? tone.orbLit : tone.orb) : undefined,
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
