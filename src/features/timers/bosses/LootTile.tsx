import { Flex, Icon, Image } from "@chakra-ui/react"
import { getLootIcon } from "@assets/timers/loot"
import type { LootDrop } from "@timers/config/fieldBossLoot"
import { Tooltip } from "@ui/tooltip"
import {
    getBindingLabel,
    getLootChanceLabel,
    isBoundLoot,
} from "@timers/logic/lootDetails"
import { LuLock, LuSparkles } from "react-icons/lu"
import { LootChance } from "./LootChance"
import { LootTooltip } from "./LootTooltip"

type LootTileProps = {
    drop: LootDrop
}

// One drop as its icon, framed in its grade's colour, over who gets it and
// its chance. A lock in the corner marks a bound drop.
export const LootTile = ({ drop }: LootTileProps) => {
    const icon = drop.icon && getLootIcon(drop.icon)

    return (
        <Flex as="li">
            <Tooltip
                content={<LootTooltip drop={drop} />}
                openDelay={100}
                showArrow
            >
                <Flex
                    asChild
                    w="12"
                    flexDir="column"
                    alignItems="center"
                    gap="0.5"
                    borderRadius="md"
                    _focusVisible={{
                        outline: "2px solid",
                        outlineColor: "app.accent",
                    }}
                >
                    <button
                        type="button"
                        aria-label={`${drop.name}, ${getLootChanceLabel(drop)}, ${getBindingLabel(drop)}`}
                    >
                        <Flex
                            position="relative"
                            boxSize="10"
                            alignItems="center"
                            justifyContent="center"
                            bg="app.inset"
                            borderColor={`grade.${drop.grade}` as const}
                            borderWidth="1px"
                            borderRadius="md"
                            color={`grade.${drop.grade}` as const}
                        >
                            {icon ? (
                                <Image
                                    src={icon}
                                    boxSize="9"
                                    objectFit="contain"
                                    alt=""
                                />
                            ) : (
                                <Icon boxSize="4">
                                    <LuSparkles />
                                </Icon>
                            )}

                            {isBoundLoot(drop) && (
                                <Flex
                                    position="absolute"
                                    top="-1.5"
                                    right="-1.5"
                                    boxSize="4"
                                    alignItems="center"
                                    justifyContent="center"
                                    bg="app.panel"
                                    borderColor="app.danger"
                                    borderWidth="1px"
                                    borderRadius="full"
                                    color="app.danger"
                                >
                                    <Icon boxSize="2.5">
                                        <LuLock />
                                    </Icon>
                                </Flex>
                            )}
                        </Flex>

                        <LootChance drop={drop} />
                    </button>
                </Flex>
            </Tooltip>
        </Flex>
    )
}
