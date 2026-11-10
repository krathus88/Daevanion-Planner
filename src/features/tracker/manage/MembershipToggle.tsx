import { Checkbox, Flex, Text } from "@chakra-ui/react"

type MembershipToggleProps = {
    checked: boolean
    onChange: (membership: boolean) => void
}

// The membership is per account, so one switch for every character.
export const MembershipToggle = ({
    checked,
    onChange,
}: MembershipToggleProps) => {
    const handleCheckedChange = (details: Checkbox.CheckedChangeDetails) => {
        onChange(details.checked === true)
    }

    return (
        <Flex flexDir="column" gap="1">
            <Checkbox.Root
                size="sm"
                checked={checked}
                onCheckedChange={handleCheckedChange}
            >
                <Checkbox.HiddenInput />

                <Checkbox.Control />

                <Checkbox.Label>Special Quai Membership</Checkbox.Label>
            </Checkbox.Root>

            <Text textStyle="hint">
                For the whole account: Odyle Energy recharges up to 840 with it,
                560 without.
            </Text>
        </Flex>
    )
}
