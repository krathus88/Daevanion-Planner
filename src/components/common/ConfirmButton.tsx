import { Button, Flex, type ButtonProps } from "@chakra-ui/react"
import { useState } from "react"

type ConfirmButtonProps = ButtonProps & {
    confirmLabel: string
    onConfirm: () => void
}

// Asks once more in place before doing something that can't be undone.
export const ConfirmButton = ({
    children,
    confirmLabel,
    onConfirm,
    ...props
}: ConfirmButtonProps) => {
    const [asking, setAsking] = useState(false)

    const handleAsk = () => {
        setAsking(true)
    }

    const handleCancel = () => {
        setAsking(false)
    }

    const handleConfirm = () => {
        setAsking(false)
        onConfirm()
    }

    if (asking) {
        return (
            <Flex flexShrink="0" alignItems="center" gap="1">
                <Button variant="danger" size="xs" onClick={handleConfirm}>
                    {confirmLabel}
                </Button>

                <Button variant="ghost" size="xs" onClick={handleCancel}>
                    Cancel
                </Button>
            </Flex>
        )
    }

    return (
        <Button {...props} onClick={handleAsk}>
            {children}
        </Button>
    )
}
