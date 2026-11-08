// What browsers say when a code-split chunk is gone, usually because the site
// was deployed again since the tab was opened (Chrome, Firefox, Safari).
const STALE_CHUNK_MESSAGES = [
    "Failed to fetch dynamically imported module",
    "error loading dynamically imported module",
    "Importing a module script failed",
]

const getMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message
    }

    return String(error)
}

// Whether reloading picks up a newer version of the site that fixes it.
export const isStaleVersionError = (error: unknown) => {
    const message = getMessage(error)

    for (const known of STALE_CHUNK_MESSAGES) {
        if (message.includes(known)) {
            return true
        }
    }

    return false
}

// The error as plain text to read or copy into a bug report: its message,
// stack, the page it happened on and, for render errors, the components.
export const getErrorDetails = (
    error: unknown,
    page: string,
    componentStack?: string,
) => {
    const lines: string[] = []
    const message =
        error instanceof Error
            ? `${error.name}: ${error.message}`
            : getMessage(error)
    const stack = error instanceof Error ? error.stack : undefined

    // Chrome's stack starts with the message; Firefox's doesn't.
    if (stack && stack.includes(error instanceof Error ? error.message : "")) {
        lines.push(stack.trim())
    } else {
        lines.push(message)

        if (stack) {
            lines.push(stack.trim())
        }
    }

    if (componentStack) {
        lines.push(`Components:${componentStack.trimEnd()}`)
    }

    lines.push(`Page: ${page}`)

    return lines.join("\n\n")
}
