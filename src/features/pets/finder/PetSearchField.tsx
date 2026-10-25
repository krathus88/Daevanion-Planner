import { Icon, Input, InputGroup } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import { LuSearch } from "react-icons/lu"

type PetSearchFieldProps = {
    value: string
    onChange: (value: string) => void
}

export const PetSearchField = ({ value, onChange }: PetSearchFieldProps) => {
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
                placeholder="Search a pet or monster"
                type="search"
                autoComplete="off"
                aria-label="Search pets"
                onChange={handleChange}
            />
        </InputGroup>
    )
}
