import { Field, NativeSelect } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import type { LayoutType } from "@planner/config/layouts"
import type { PlannerOption } from "@planner/storage/allocationSnapshot"

type RouteSelectRowProps = {
    layout: LayoutType
    // The option id of the board's current route; "" for none.
    value: string
    options: PlannerOption[]
    onChange: (layout: LayoutType, plannerId: string) => void
}

export const RouteSelectRow = ({
    layout,
    value,
    options,
    onChange,
}: RouteSelectRowProps) => {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        onChange(layout, event.target.value)
    }

    return (
        <Field.Root orientation="horizontal" gap="3">
            <Field.Label w="16" fontSize="sm" textTransform="capitalize">
                {layout}
            </Field.Label>

            <NativeSelect.Root size="sm" minW="0" flex="1">
                <NativeSelect.Field value={value} onChange={handleChange}>
                    <option value="">None</option>

                    {options.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </NativeSelect.Field>

                <NativeSelect.Indicator />
            </NativeSelect.Root>
        </Field.Root>
    )
}
