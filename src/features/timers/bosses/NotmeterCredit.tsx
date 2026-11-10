import { Link, Text } from "@chakra-ui/react"

type NotmeterCreditProps = {
    error: string | null
}

// Credits NotMeter's live times, and says so when they can't be read.
export const NotmeterCredit = ({ error }: NotmeterCreditProps) => {
    return (
        <Text textStyle="hint" color={error ? "app.warning" : undefined}>
            {error ? "Live times from " : "Live spawn times from "}

            <Link
                href="https://notmeter.com/?view=field-boss"
                color="app.muted"
                target="_blank"
                rel="noreferrer"
            >
                NotMeter
            </Link>

            {error ? ` can't be read right now (${error}).` : "."}
        </Text>
    )
}
