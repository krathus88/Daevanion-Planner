import { Text } from "@chakra-ui/react"
import { Term } from "@common/Term"
import type { PetBoss } from "@pets/config/petBosses"

type BossSourceProps = {
    boss: PetBoss
    // A field pet: its soul monsters also spawn on the maps above.
    field: boolean
}

// Where a dungeon boss pet's soul drops. Non-field pets also come from
// chests and merchants.
export const BossSource = ({ boss, field }: BossSourceProps) => {
    const bossName = boss.boss ? <Term>{boss.boss}</Term> : "it"
    const verb = field ? "also drops" : "drops"

    return (
        <Text textStyle="hint">
            {boss.confirmed ? (
                <>
                    Its soul {verb} from killing {bossName} as a boss in the{" "}
                    <Term>{boss.dungeon}</Term> expedition.
                </>
            ) : (
                <>
                    Its soul may drop from killing {bossName} as a boss in the{" "}
                    <Term>{boss.dungeon}</Term> expedition; not yet confirmed in
                    game.
                </>
            )}
            {!field && (
                <>
                    {" "}
                    Souls also come from <Term>pet soul chests</Term> and the{" "}
                    <Term>Black Cloud Merchants</Term>.
                </>
            )}
        </Text>
    )
}
