import { Flex } from "@chakra-ui/react"
import type { BoardWant, Want } from "@planner/logic/boardWants"
import { BoardWantRow } from "./BoardWantRow"

type BoardWantListProps = {
    wants: BoardWant[]
    values: ReadonlyMap<string, Want>
    plannedPath: ReadonlySet<string>
    onChange: (want: BoardWant, value: Want) => void
}

export const BoardWantList = ({
    wants,
    values,
    plannedPath,
    onChange,
}: BoardWantListProps) => {
    return (
        <Flex flexDir="column" gap="2">
            {wants.map((want) => (
                <BoardWantRow
                    key={want.id}
                    want={want}
                    value={values.get(want.id) ?? "skip"}
                    taken={
                        want.keys.filter((key) => plannedPath.has(key)).length
                    }
                    onChange={onChange}
                />
            ))}
        </Flex>
    )
}
