import { Button, Flex, Text } from "@chakra-ui/react"
import { Section } from "@common/Section"
import { useState } from "react"
import { LuCheck, LuCopy } from "react-icons/lu"

type AppErrorDetailsProps = {
    details: string
}

// The error's text, collapsed, with a button to copy it for a bug report.
export const AppErrorDetails = ({ details }: AppErrorDetailsProps) => {
    const [copied, setCopied] = useState(false)

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(details)
            setCopied(true)
        } catch {
            // The text stays there to select by hand.
        }
    }

    const handleCopy = () => {
        void copy()
    }

    return (
        <Section title="Error details" variant="sub">
            <Flex flexDir="column" alignItems="flex-start" gap="2">
                <Text
                    as="pre"
                    p="3"
                    w="full"
                    maxH="64"
                    overflow="auto"
                    layerStyle="inset"
                    borderRadius="md"
                    color="app.muted"
                    fontFamily="mono"
                    fontSize="xs"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                >
                    {details}
                </Text>

                <Button variant="secondary" size="xs" onClick={handleCopy}>
                    {copied ? <LuCheck /> : <LuCopy />}
                    {copied ? "Copied" : "Copy details"}
                </Button>
            </Flex>
        </Section>
    )
}
