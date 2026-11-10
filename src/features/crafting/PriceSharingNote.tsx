import { Text } from "@chakra-ui/react"

type PriceSharingNoteProps = {
    serverName: string
    // Logged in: prices set here go to everyone on the server.
    sharing: boolean
}

export const PriceSharingNote = ({
    serverName,
    sharing,
}: PriceSharingNoteProps) => {
    return (
        <Text textStyle="hint">
            {sharing
                ? `Prices are per server: the ones you set are shared with everyone on ${serverName}.`
                : `Prices are per server: you see the ones shared on ${serverName}; log in to share yours, else they stay on this device.`}
        </Text>
    )
}
