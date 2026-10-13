import { useState } from "react"
import { Box, Button, Flex, Text } from "@chakra-ui/react"
import type { Position } from "../config/boardConfig"
import {
    POINTS_PER_NODE_TYPE,
    type BoardNodeAppearance,
} from "../config/layouts"
import type { ClassAbility } from "../../../../config/classPresets"
import { SPECIAL_BONUSES, type SpecialBonusType } from "../config/specialNodes"
import { STAT_NAMES, STAT_TOOLTIPS, type StatType } from "../config/stats"
import { Tooltip } from "@ui/tooltip"

const tooltipContentProps = {
    background: "app.raised",
    borderColor: "app.borderStrong",
    borderWidth: "1px",
    color: "app.fg",
    fontSize: "xs",
    "--tooltip-bg": "colors.app.raised",
} as const

type BoardCellProps = {
    kind: string
    mainNode: BoardNodeAppearance
    startNode: BoardNodeAppearance
    specialNodes: Readonly<Record<string, BoardNodeAppearance>>
    position: Position
    selected: boolean
    canSelect: boolean
    adjacentAvailable: boolean
    targeted: boolean
    ability?: ClassAbility
    stat?: StatType
    specialBonus?: SpecialBonusType
    onSelect: (position: Position) => void
}

// Tooltip type line, matching the node's colour on the board.
const typeColors: Partial<Record<BoardNodeAppearance["type"], string>> = {
    basic: "app.fg",
    skill: "blue.400",
    passive: "green.400",
    special: "#efc05b",
}

const DIAMOND = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
const ZOOM_TRANSITION = "transform 160ms ease, filter 160ms ease"

const BASIC_SIZE = "1.875rem"
const SPECIAL_SIZE = "3.75rem"
const START_SIZE = "3.25rem"

export const BoardCell = ({
    kind,
    mainNode,
    startNode,
    specialNodes,
    position,
    selected,
    canSelect,
    adjacentAvailable,
    targeted,
    ability,
    stat,
    specialBonus,
    onSelect,
}: BoardCellProps) => {
    const [failedImageSource, setFailedImageSource] = useState<string | null>(
        null,
    )

    if (kind === ".") {
        return <Box aria-hidden="true" height="3.5rem" width="3.5rem" />
    }

    if (kind === "S") {
        return (
            <Box height="3.5rem" position="relative" width="3.5rem">
                <Tooltip
                    content={startNode.label}
                    contentProps={tooltipContentProps}
                    openDelay={100}
                    showArrow
                >
                    <Box
                        alignItems="center"
                        aria-label={startNode.name}
                        background="radial-gradient(circle at 50% 40%, #fbe7b5 0%, #e3b866 45%, #a87b34 100%)"
                        borderRadius="full"
                        boxShadow="0 0 0 1px rgba(255, 226, 160, 0.55), 0 0 18px 4px rgba(217, 179, 108, 0.45)"
                        color="#2a1d06"
                        display="flex"
                        fontSize="xs"
                        fontWeight="semibold"
                        height={START_SIZE}
                        justifyContent="center"
                        left="50%"
                        position="absolute"
                        role="img"
                        top="50%"
                        transform="translate(-50%, -50%)"
                        width={START_SIZE}
                        zIndex="1"
                    />
                </Tooltip>
            </Box>
        )
    }

    const appearance = specialNodes[kind] ?? mainNode
    const imageSource = ability?.icon ?? appearance.imageBackground
    const imageFailed = imageSource === failedImageSource
    const pointCost = POINTS_PER_NODE_TYPE[appearance.type]
    const isBasic = appearance.type === "basic"
    const isSpecial = appearance.type === "special"
    const visualSize = isBasic
        ? BASIC_SIZE
        : isSpecial
          ? SPECIAL_SIZE
          : "3.5rem"
    const shapeBackground = isBasic
        ? selected
            ? "white"
            : "rgba(255, 255, 255, 0.12)"
        : isSpecial
          ? "linear-gradient(135deg, #f6d68a 0%, #d9a441 45%, #9a6a22 100%)"
          : appearance.backgroundColor
    const shapeClipPath = isSpecial ? DIAMOND : undefined
    const borderColor = targeted
        ? "yellow.500"
        : selected
          ? "yellow.400"
          : ability
            ? ability.type === "passive"
                ? "green.400"
                : "blue.400"
            : adjacentAvailable
              ? "teal.400"
              : isBasic
                ? "white"
                : isSpecial
                  ? "#efc05b"
                  : "gray.300"
    const shapeShadow =
        selected && ability
            ? "0 0 0 3px rgba(250, 204, 21, 0.9), 0 0 14px rgba(250, 204, 21, 0.45)"
            : selected && !isSpecial
              ? "0 0 0 2px rgba(37, 99, 235, 0.55), 0 0 14px rgba(37, 99, 235, 0.6)"
              : adjacentAvailable && !isSpecial
                ? "0 0 10px 2px rgba(45, 212, 191, 0.55)"
                : "none"
    // Hovering zooms the artwork inside the frame instead of growing the node.
    // Stat nodes have no artwork, so they light up instead.
    const hoverCss = canSelect
        ? {
              "&:hover [data-zoom]": {
                  transform: "scale(1.15)",
                  filter: "brightness(1.12)",
              },
              ...(isBasic && {
                  "&:hover [data-shape]": {
                      background: selected
                          ? "white"
                          : "rgba(255, 255, 255, 0.32)",
                      boxShadow: [
                          shapeShadow === "none" ? null : shapeShadow,
                          "0 0 10px rgba(255, 255, 255, 0.45)",
                      ]
                          .filter(Boolean)
                          .join(", "),
                  },
              }),
              "@media (prefers-reduced-motion: reduce)": {
                  "& [data-zoom]": { transition: "none" },
              },
          }
        : undefined
    const nodeName =
        ability?.name ??
        (stat && STAT_NAMES[stat]) ??
        (specialBonus && SPECIAL_BONUSES[specialBonus].name)
    const nodeTooltip =
        ability?.tooltip ??
        (stat && STAT_TOOLTIPS[stat]) ??
        (specialBonus && SPECIAL_BONUSES[specialBonus].tooltip)
    const tooltipContent = (
        <Flex direction="column" gap="0.5" px="1" py="1">
            {nodeName && (
                <Text fontSize="md" fontWeight="semibold" lineHeight="short">
                    {nodeName}
                </Text>
            )}
            <Text
                color={typeColors[ability?.type ?? appearance.type]}
                fontSize="sm"
                lineHeight="short"
            >
                {appearance.name} · {pointCost} pts
            </Text>
            {nodeTooltip && (
                <Text lineHeight="short" mt="1.5">
                    {nodeTooltip}
                </Text>
            )}
        </Flex>
    )
    // Special nodes are recognisable by shape (name in the tooltip), and a
    // selected basic node is already shown by its fill, so neither gets text.
    const cellLabel =
        isSpecial || isBasic
            ? ""
            : ability
              ? selected && !ability.icon
                  ? "✓"
                  : ""
              : appearance.label || (selected ? "✓" : "")

    return (
        <Box height="3.5rem" position="relative" width="3.5rem">
            <Tooltip
                content={tooltipContent}
                contentProps={tooltipContentProps}
                openDelay={100}
                showArrow
            >
                <Button
                    aria-label={[
                        `Row ${position.row + 1}, column ${position.column + 1}`,
                        appearance.name,
                        nodeName,
                        `${pointCost} point${pointCost === 1 ? "" : "s"}`,
                        targeted ? "required target" : "",
                        selected ? "selected" : "not selected",
                    ]
                        .filter(Boolean)
                        .join(", ")}
                    aria-pressed={selected || targeted}
                    aria-disabled={!canSelect}
                    onClick={() => onSelect(position)}
                    padding="0"
                    size="sm"
                    height={visualSize}
                    minHeight={visualSize}
                    minWidth={visualSize}
                    width={visualSize}
                    flexShrink="0"
                    position="absolute"
                    left="50%"
                    top="50%"
                    transform="translate(-50%, -50%)"
                    touchAction="manipulation"
                    variant="ghost"
                    backgroundColor="transparent"
                    border="none"
                    borderRadius={isBasic ? "full" : "sm"}
                    clipPath={shapeClipPath}
                    cursor={canSelect ? "pointer" : "not-allowed"}
                    zIndex="1"
                    css={hoverCss}
                    color="gray.900"
                >
                    {isSpecial && (
                        <Box
                            aria-hidden="true"
                            background={borderColor}
                            clipPath={shapeClipPath}
                            height={visualSize}
                            left="50%"
                            position="absolute"
                            top="50%"
                            transform="translate(-50%, -50%)"
                            width={visualSize}
                            zIndex="1"
                        />
                    )}

                    <Box
                        aria-hidden="true"
                        background={
                            appearance.imageBackground &&
                            !ability?.icon &&
                            !imageFailed
                                ? "transparent"
                                : shapeBackground
                        }
                        borderColor={borderColor}
                        borderRadius={isBasic ? "full" : "sm"}
                        borderStyle="solid"
                        borderWidth={
                            isSpecial
                                ? "0"
                                : selected || adjacentAvailable || targeted
                                  ? "3px"
                                  : "1px"
                        }
                        boxShadow={shapeShadow}
                        data-shape=""
                        transition="background 160ms ease, box-shadow 160ms ease"
                        clipPath={shapeClipPath}
                        height={isSpecial ? "calc(100% - 6px)" : visualSize}
                        left="50%"
                        overflow="hidden"
                        position="absolute"
                        top="50%"
                        transform="translate(-50%, -50%)"
                        width={isSpecial ? "calc(100% - 6px)" : visualSize}
                        zIndex={isSpecial ? "2" : undefined}
                    >
                        {isSpecial && <SpecialGem />}
                        {imageSource && !imageFailed && (
                            <img
                                aria-hidden="true"
                                alt=""
                                onError={() =>
                                    setFailedImageSource(
                                        appearance.imageBackground ?? null,
                                    )
                                }
                                data-zoom=""
                                src={imageSource}
                                style={{
                                    transition: ZOOM_TRANSITION,
                                    height: "100%",
                                    inset: 0,
                                    objectFit: ability?.icon
                                        ? "contain"
                                        : "cover",
                                    position: "absolute",
                                    width: "100%",
                                }}
                            />
                        )}
                    </Box>
                </Button>
            </Tooltip>

            {targeted && (
                <Box
                    aria-hidden="true"
                    background="yellow.400"
                    border="2px solid"
                    borderColor="gray.900"
                    borderRadius="full"
                    boxShadow="0 0 6px rgba(250, 204, 21, 0.8)"
                    height="0.75rem"
                    pointerEvents="none"
                    position="absolute"
                    right="0.1rem"
                    top="0.1rem"
                    width="0.75rem"
                    zIndex="4"
                />
            )}

            <Text
                background={
                    cellLabel && imageSource && !imageFailed
                        ? "blackAlpha.600"
                        : "transparent"
                }
                borderRadius="sm"
                color={
                    cellLabel && (selected || (imageSource && !imageFailed))
                        ? "white"
                        : "inherit"
                }
                fontSize="xs"
                lineHeight="short"
                left="50%"
                maxWidth="100%"
                pointerEvents="none"
                position="absolute"
                top="50%"
                textOverflow="ellipsis"
                transform="translate(-50%, -50%)"
                whiteSpace="normal"
                zIndex="3"
            >
                {cellLabel}
            </Text>
        </Box>
    )
}

// Facets inside a special node's diamond: a sheen across the top-left, an
// inset diamond outline and a bright centre stone. Zooms on hover.
const SpecialGem = () => (
    <>
        <Box
            background="linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 45%)"
            inset="0"
            position="absolute"
        />
        <Box
            data-zoom=""
            inset="0"
            position="absolute"
            transition={ZOOM_TRANSITION}
        >
            <Box
                background="rgba(110, 68, 14, 0.4)"
                clipPath={DIAMOND}
                inset="22%"
                position="absolute"
            />
            <Box
                background="linear-gradient(135deg, #fff3cc 0%, #ebbd5e 50%, #b5802c 100%)"
                clipPath={DIAMOND}
                inset="calc(22% + 2px)"
                position="absolute"
            />
            <Box
                background="radial-gradient(circle at 40% 35%, #ffffff 0%, #fff4d1 45%, #f0c66a 100%)"
                boxShadow="0 0 6px rgba(255, 244, 209, 0.9)"
                clipPath={DIAMOND}
                inset="39%"
                position="absolute"
            />
        </Box>
    </>
)
