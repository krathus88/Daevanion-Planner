import { Box, Button, Flex, Icon, Text } from "@chakra-ui/react"
import { OdyleEnergy } from "@assets/tracker"
import { HOVER_REVEAL } from "@common/hoverReveal"
import { IconImage } from "@common/IconImage"
import { WholeNumberInput } from "@common/WholeNumberInput"
import { ODYLE_ENERGY } from "@tracker/config/odyleEnergy"
import {
    getEnergyLevel,
    spendEnergy,
    type EnergyLeft,
} from "@tracker/logic/odyleEnergy"
import { Tooltip } from "@ui/tooltip"
import { useState, type ChangeEvent, type FocusEvent } from "react"
import { LuTriangleAlert } from "react-icons/lu"
import { CompanionLocked } from "@account/CompanionLocked"

type OdyleEnergyRowProps = {
    left: EnergyLeft
    cap: number
    // What a reward cube takes (more with the membership).
    cubeCost: number
    ownerLabel: string
    // Filled by the companion app: no edits or cube button.
    locked?: boolean
    onChange: (left: EnergyLeft) => void
}

const EXTRA_CAP = ODYLE_ENERGY.extraCap

// Short enough to fit the row the cube button sets, so editing doesn't
// change its height.
const FIELD = {
    size: "xs",
    h: "6",
    w: "12",
    px: "1",
    textAlign: "center",
} as const

// Only the recharged energy counts: a capped one wastes recharges, the extra
// from items never does.
const LEVEL_STYLE = {
    ok: { color: "app.fg", hint: undefined },
    soon: {
        color: "app.warning",
        hint: "Caps within 2 recharges: spend some before it wastes them",
    },
    capped: {
        color: "app.danger",
        hint: "Capped: recharges are wasted until you spend some",
    },
} as const

// Straight on a character's card, above its task boxes: not a task, so no
// box, tile or progress. Its icon and the total; clicking the total shows the
// recharged energy and the extra from items as fields, typed to match the
// game, until focus leaves it. The cube button, right of the total and shown
// on hover, takes the recharged energy first.
export const OdyleEnergyRow = ({
    left,
    cap,
    cubeCost,
    ownerLabel,
    locked = false,
    onChange,
}: OdyleEnergyRowProps) => {
    const [editing, setEditing] = useState(false)

    const handleEdit = () => {
        setEditing(true)
    }

    // Closes once focus moves out of the row, not between its fields.
    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setEditing(false)
        }
    }

    const handleBaseChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange({ ...left, base: Number(event.target.value || "0") })
    }

    const handleBonusChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange({ ...left, bonus: Number(event.target.value || "0") })
    }

    const handleSpend = () => {
        onChange(spendEnergy(left, cubeCost))
    }

    const label = `Odyle Energy, ${ownerLabel}`
    const total = left.base + left.bonus
    const level = LEVEL_STYLE[getEnergyLevel(left.base, cap)]

    return (
        <Flex
            // For the cube button, shown on hover.
            className="group"
            flexWrap="wrap"
            alignItems="center"
            gap="1"
            onBlur={handleBlur}
        >
            <Tooltip content="Odyle Energy" openDelay={300}>
                <Box flexShrink="0">
                    <IconImage icon={OdyleEnergy} />
                </Box>
            </Tooltip>

            {editing ? (
                <>
                    <WholeNumberInput
                        {...FIELD}
                        value={String(left.base)}
                        autoFocus
                        aria-label={`Energy: ${label}`}
                        onChange={handleBaseChange}
                    />

                    <Text textStyle="caption">/{cap} +</Text>

                    <Tooltip
                        content={`Extra energy from items, up to ${EXTRA_CAP}`}
                        openDelay={300}
                    >
                        <WholeNumberInput
                            {...FIELD}
                            value={String(left.bonus)}
                            aria-label={`Extra energy: ${label}`}
                            onChange={handleBonusChange}
                        />
                    </Tooltip>
                </>
            ) : (
                <CompanionLocked locked={locked} side="end">
                    <Tooltip
                        content={level.hint ?? "Click to edit"}
                        openDelay={300}
                    >
                        <Button
                            variant="ghost"
                            size="xs"
                            h="6"
                            minW="0"
                            px="1"
                            gap="1"
                            color={level.color}
                            fontWeight="normal"
                            _hover={{ color: level.color }}
                            aria-label={`${label}: ${total}, edit`}
                            onClick={handleEdit}
                        >
                            {level.hint && (
                                <Icon boxSize="3.5">
                                    <LuTriangleAlert />
                                </Icon>
                            )}
                            {/* Like a task's entries: recharged of its cap,
                            then the extra from items (red once at 2000), both
                            larger than the cap. */}
                            <Text
                                as="span"
                                fontVariantNumeric="tabular-nums"
                                whiteSpace="nowrap"
                            >
                                <Text as="span" fontSize="sm">
                                    {left.base}
                                </Text>
                                <Text as="span" color="app.subtle">
                                    /{cap}
                                </Text>
                                <Text
                                    as="span"
                                    color={
                                        left.bonus >= EXTRA_CAP
                                            ? "app.dangerFaint"
                                            : "app.successFaint"
                                    }
                                    fontSize="sm"
                                >
                                    {` +${left.bonus}`}
                                </Text>
                            </Text>
                        </Button>
                    </Tooltip>
                </CompanionLocked>
            )}

            {!locked && (
                // Shown while the row is hovered (always on touch screens).
                <Tooltip
                    content="Opens a reward cube: spends recharged energy first, then extra"
                    openDelay={300}
                >
                    <Button
                        variant="ghost"
                        size="xs"
                        color="app.accent"
                        fontWeight="semibold"
                        _hover={{ bg: "app.accentMuted", color: "app.accent" }}
                        _canHover={HOVER_REVEAL}
                        disabled={total < cubeCost}
                        aria-label={`Spend ${cubeCost}: ${label}`}
                        onClick={handleSpend}
                    >
                        −{cubeCost}
                    </Button>
                </Tooltip>
            )}
        </Flex>
    )
}
