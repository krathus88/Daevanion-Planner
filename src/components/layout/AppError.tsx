import { Button, Container, Flex, Heading, Icon, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { LuRefreshCw, LuTriangleAlert } from "react-icons/lu"
import { getErrorDetails, isStaleVersionError } from "./errorDetails"
import { AppErrorDetails } from "./AppErrorDetails"

// Shown in place of a page that crashed while rendering or loading (the
// header and footer stay, so other pages still work), or of the whole app
// when the layout itself crashed.
export const AppError = ({ error, info }: ErrorComponentProps) => {
    const handleReload = () => {
        window.location.reload()
    }

    const isStale = isStaleVersionError(error)
    const details = getErrorDetails(
        error,
        window.location.pathname + window.location.search,
        info?.componentStack,
    )

    return (
        <Container as="main" py={{ base: "8", md: "16" }} maxW="2xl" flex="1">
            <Card p="6" gap="4" role="alert">
                <Flex alignItems="center" gap="3">
                    <Icon boxSize="6" color="app.danger">
                        <LuTriangleAlert />
                    </Icon>

                    <Heading as="h2" size="lg">
                        {isStale
                            ? "A new version is out"
                            : "Something went wrong"}
                    </Heading>
                </Flex>

                <Text color="app.muted">
                    {isStale
                        ? "The site was updated since you opened it, so this page couldn't load. Reload to get the new version."
                        : "This page ran into an error and couldn't be shown. Your saved data isn't affected. Reloading usually fixes it."}
                </Text>

                <Button
                    variant="primary"
                    alignSelf="flex-start"
                    onClick={handleReload}
                >
                    <LuRefreshCw />
                    Reload page
                </Button>

                {!isStale && <AppErrorDetails details={details} />}
            </Card>
        </Container>
    )
}
