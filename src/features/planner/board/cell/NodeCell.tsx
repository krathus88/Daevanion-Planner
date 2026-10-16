import type { ClassAbility } from "@config/classPresets"
import { STAT_NAMES, type StatType } from "@config/stats/stats"
import { AbsoluteCenter, Box, Button, Image } from "@chakra-ui/react"
import { Tooltip } from "@ui/tooltip"
import { useState } from "react"
import type { Position } from "@planner/config/boardConfig"
import {
    POINTS_PER_NODE_TYPE,
    type BoardNodeAppearance,
} from "@planner/config/layouts"
import {
    SPECIAL_BONUSES,
    type SpecialBonusType,
} from "@planner/config/specialNodes"
import { CellLabel } from "./CellLabel"
import { CELL_BOX, getNodeStyles } from "./nodeStyles"
import { NodeTooltip } from "./NodeTooltip"
import { SpecialGem } from "./SpecialGem"
import { NeedMarker } from "./NeedMarker"
import { PreferMarker } from "./PreferMarker"
import { TargetMarker } from "./TargetMarker"

export type NodeCellProps = {
    position: Position
    appearance: BoardNodeAppearance
    selected: boolean
    targeted: boolean
    // Route preferences need it; your own target marker wins when both.
    needed?: boolean
    // Route preferences prefer it; shown when nothing requires it.
    preferred?: boolean
    canSelect: boolean
    // Shown as is, not dimmed, and can't be picked (a shared plan).
    readOnly?: boolean
    adjacentAvailable: boolean
    ability?: ClassAbility
    stat?: StatType
    specialBonus?: SpecialBonusType
    onSelect: (position: Position) => void
}

export const NodeCell = ({
    position,
    appearance,
    selected,
    targeted,
    needed = false,
    preferred = false,
    canSelect,
    readOnly = false,
    adjacentAvailable,
    ability,
    stat,
    specialBonus,
    onSelect,
}: NodeCellProps) => {
    const [failedImageSource, setFailedImageSource] = useState<string | null>(
        null,
    )

    const handleClick = () => {
        onSelect(position)
    }

    const handleImageError = () => {
        setFailedImageSource(appearance.imageBackground ?? null)
    }

    const imageSource = ability?.icon ?? appearance.imageBackground
    const hasImage = Boolean(imageSource) && imageSource !== failedImageSource
    const pointCost = POINTS_PER_NODE_TYPE[appearance.type]
    const styles = getNodeStyles({
        appearance: appearance,
        ability: ability,
        selected: selected,
        adjacentAvailable: adjacentAvailable,
        targeted: targeted,
        canSelect: canSelect,
    })
    const nodeName =
        ability?.name ??
        (stat && STAT_NAMES[stat]) ??
        (specialBonus && SPECIAL_BONUSES[specialBonus].name)
    // Special nodes are recognisable by shape (name in the tooltip), and a
    // selected stat node is already shown by its fill, so neither gets text.
    const label =
        styles.isSpecial || styles.isBasic
            ? ""
            : ability
              ? selected && !ability.icon
                  ? "✓"
                  : ""
              : appearance.label || (selected ? "✓" : "")

    return (
        <Box pos="relative" boxSize={CELL_BOX}>
            <Tooltip
                content={
                    <NodeTooltip
                        ability={ability}
                        appearance={appearance}
                        name={nodeName}
                        specialBonus={specialBonus}
                        stat={stat}
                    />
                }
                openDelay={100}
                showArrow
            >
                <AbsoluteCenter asChild>
                    <Button
                        variant="plain"
                        size="sm"
                        zIndex="board.node"
                        p="0"
                        boxSize={styles.size}
                        minW={styles.size}
                        minH={styles.size}
                        flexShrink="0"
                        borderWidth="0"
                        borderRadius={styles.borderRadius}
                        color="board.ink"
                        clipPath={styles.clipPath}
                        cursor={
                            canSelect
                                ? "button"
                                : readOnly
                                  ? "static"
                                  : "disabled"
                        }
                        touchAction="manipulation"
                        css={styles.hoverCss}
                        aria-disabled={!canSelect && !readOnly}
                        aria-label={[
                            `Row ${position.row + 1}, column ${position.column + 1}`,
                            appearance.name,
                            nodeName,
                            `${pointCost} point${pointCost === 1 ? "" : "s"}`,
                            targeted ? "required target" : "",
                            needed && !targeted
                                ? "needed by route preferences"
                                : "",
                            preferred && !needed && !targeted
                                ? "preferred if no more costly"
                                : "",
                            selected ? "selected" : "not selected",
                        ]
                            .filter(Boolean)
                            .join(", ")}
                        aria-pressed={selected || targeted}
                        onClick={handleClick}
                    >
                        {styles.isSpecial && (
                            <AbsoluteCenter
                                zIndex="board.node"
                                boxSize={styles.size}
                                bg={styles.borderColor}
                                clipPath={styles.clipPath}
                                aria-hidden="true"
                            />
                        )}

                        <AbsoluteCenter
                            zIndex={styles.isSpecial ? "board.face" : undefined}
                            boxSize={
                                styles.isSpecial
                                    ? "node.specialFace"
                                    : styles.size
                            }
                            overflow="hidden"
                            bg={
                                appearance.imageBackground &&
                                !ability?.icon &&
                                hasImage
                                    ? "transparent"
                                    : styles.fill
                            }
                            bgImage={
                                styles.isSpecial && !hasImage
                                    ? "board.special"
                                    : undefined
                            }
                            borderWidth={styles.borderWidth}
                            borderColor={styles.borderColor}
                            borderRadius={styles.borderRadius}
                            boxShadow={styles.shadow}
                            clipPath={styles.clipPath}
                            transitionProperty="shape"
                            transitionDuration="fast"
                            aria-hidden="true"
                            data-shape=""
                        >
                            {styles.isSpecial && <SpecialGem />}

                            {imageSource && hasImage && (
                                <Image
                                    src={imageSource}
                                    pos="absolute"
                                    inset="0"
                                    w="full"
                                    h="full"
                                    objectFit={
                                        ability?.icon ? "contain" : "cover"
                                    }
                                    transitionProperty="zoom"
                                    transitionDuration="fast"
                                    alt=""
                                    aria-hidden="true"
                                    data-zoom=""
                                    onError={handleImageError}
                                />
                            )}
                        </AbsoluteCenter>
                    </Button>
                </AbsoluteCenter>
            </Tooltip>

            {targeted ? (
                <TargetMarker />
            ) : needed ? (
                <NeedMarker />
            ) : (
                preferred && <PreferMarker />
            )}

            <CellLabel hasImage={hasImage} label={label} selected={selected} />
        </Box>
    )
}
