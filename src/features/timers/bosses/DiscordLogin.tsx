import { Button, Flex, Icon, Text } from "@chakra-ui/react"
import { useAuth } from "@account/hooks/useAuth"
import { signIn, signOut } from "@account/auth"
import { FaDiscord } from "react-icons/fa6"

export const DiscordLogin = () => {
    const auth = useAuth()

    const handleSignIn = () => {
        void signIn()
    }

    const handleSignOut = () => {
        void signOut()
    }

    if (auth.status === "loading") {
        return null
    }

    if (auth.status === "signedOut") {
        return (
            <Flex flexDir="column" alignItems="flex-start" gap="1.5">
                <Text textStyle="hint">Only for people on the list.</Text>

                {auth.error && (
                    <Text textStyle="caption" color="app.danger">
                        {auth.error}
                    </Text>
                )}

                <Button variant="secondary" size="xs" onClick={handleSignIn}>
                    <Icon>
                        <FaDiscord />
                    </Icon>
                    Log in with Discord
                </Button>
            </Flex>
        )
    }

    return (
        <Flex alignItems="center" justifyContent="space-between" gap="3">
            <Flex minW="0" flexDir="column">
                <Text fontSize="sm" fontWeight="semibold" truncate>
                    {auth.name}
                </Text>

                <Text textStyle="caption">
                    {auth.isReporter
                        ? "Your reports are shared"
                        : "Not on the list: reports stay on this device"}
                </Text>
            </Flex>

            <Button variant="ghost" size="xs" onClick={handleSignOut}>
                Log out
            </Button>
        </Flex>
    )
}
