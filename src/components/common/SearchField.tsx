import { Icon, Input, InputGroup } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import { LuSearch } from "react-icons/lu"

type SearchFieldProps = {
    value: string
    placeholder: string
    label: string
    onChange: (value: string) => void
}

export const SearchField = ({
    value,
    placeholder,
    label,
    onChange,
}: SearchFieldProps) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value)
    }

    return (
        <InputGroup
            startElement={
                <Icon boxSize="4" color="app.subtle">
                    <LuSearch />
                </Icon>
            }
        >
            <Input
                size="sm"
                value={value}
                placeholder={placeholder}
                type="search"
                autoComplete="off"
                aria-label={label}
                onChange={handleChange}
            />
        </InputGroup>
    )
}
