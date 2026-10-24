import { Flex, Text } from "@chakra-ui/react"
import type { ReactNode } from "react"
import { ProgressBar } from "@common/ProgressBar"

type BudgetGroupProps = {
    children: ReactNode
    title: string
    allocated: number
    total: number
}

export const BudgetGroup = ({
    children,
    title,
    allocated,
    total,
}: BudgetGroupProps) => {
    const remaining = total - allocated
    const isOverBudget = remaining < 0

    return (
        <Flex flexDir="column" gap="2">
            <Flex alignItems="baseline" justifyContent="space-between">
                <Text textStyle="label">{title}</Text>

                <Text
                    color={isOverBudget ? "app.danger" : "app.muted"}
                    fontSize="xs"
                >
                    {isOverBudget
                        ? `${Math.abs(remaining)} over budget`
                        : `${remaining} left`}
                </Text>
            </Flex>

            {children}

            <Flex pt="1" flexDir="column" gap="1.5">
                <Flex
                    justifyContent="space-between"
                    fontSize="sm"
                    fontWeight="semibold"
                >
                    <Text>Allocated</Text>

                    <Text>
                        {allocated} / {total}
                    </Text>
                </Flex>

                <ProgressBar
                    label={`${title} allocated`}
                    tone={isOverBudget ? "danger" : "accent"}
                    // A route on a zero budget is over it, so fills the bar.
                    value={
                        total > 0
                            ? Math.min(100, (allocated / total) * 100)
                            : allocated > 0
                              ? 100
                              : 0
                    }
                />
            </Flex>
        </Flex>
    )
}
