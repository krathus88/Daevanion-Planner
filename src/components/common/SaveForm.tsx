import { Button, Flex, Input } from "@chakra-ui/react"
import type { ChangeEvent, FormEvent } from "react"

type SaveFormProps = {
    value: string
    disabled: boolean
    label: string
    onChange: (value: string) => void
    onSave: () => void
}

export const SaveForm = ({
    value,
    disabled,
    label,
    onChange,
    onSave,
}: SaveFormProps) => {
    const handleSubmit = (event: FormEvent<HTMLDivElement>) => {
        event.preventDefault()

        if (!disabled) {
            onSave()
        }
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value)
    }

    return (
        <Flex as="form" alignItems="center" gap="2" onSubmit={handleSubmit}>
            <Input
                size="sm"
                placeholder={label}
                value={value}
                aria-label={label}
                onChange={handleChange}
            />

            <Button
                variant="secondary"
                size="sm"
                type="submit"
                disabled={disabled}
            >
                Save
            </Button>
        </Flex>
    )
}
