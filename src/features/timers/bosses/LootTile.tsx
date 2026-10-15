import { Flex, Icon, Image } from "@chakra-ui/react"
import { getLootIcon } from "@assets/timers/loot"
import type { LootDrop } from "@timers/config/fieldBossLoot"
import { Tooltip } from "@ui/tooltip"
import { getLootChanceLabel } from "@timers/logic/lootDetails"
import { LuSparkles } from "react-icons/lu"
import { LootChance } from "./LootChance"
import { LootTooltip } from "./LootTooltip"

type LootTileProps = {
    drop: LootDrop
}

// One drop as its icon, framed in its grade's colour, over who gets it and
// its chance.
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
                        aria-label={`${drop.name}, ${getLootChanceLabel(drop)}`}
                    >
                        <Flex
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
                        </Flex>

                        <LootChance drop={drop} />
                    </button>
                </Flex>
            </Tooltip>
        </Flex>
    )
}
