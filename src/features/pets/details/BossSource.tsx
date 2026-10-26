import { Text } from "@chakra-ui/react"
import { Term } from "@common/Term"
import type { PetBoss } from "@pets/config/petBosses"

type BossSourceProps = {
    boss: PetBoss
}

// Where a dungeon boss pet's soul drops; like other non-field pets, it
// also comes from chests and merchants.
export const BossSource = ({ boss }: BossSourceProps) => {
    const bossName = boss.boss ? <Term>{boss.boss}</Term> : "it"

    return (
        <Text textStyle="hint">
            {boss.confirmed ? (
                <>
                    Its soul drops from killing {bossName} as a boss in the{" "}
                    <Term>{boss.dungeon}</Term> expedition.
                </>
            ) : (
                <>
                    Its soul may drop from killing {bossName} as a boss in the{" "}
                    <Term>{boss.dungeon}</Term> expedition; not yet confirmed in
                    game.
                </>
            )}{" "}
            Souls also come from <Term>pet soul chests</Term> and the{" "}
            <Term>Black Cloud Merchants</Term>.
        </Text>
    )
}
