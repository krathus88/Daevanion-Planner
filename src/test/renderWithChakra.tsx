import { render } from "@testing-library/react"
import { Provider } from "@ui/provider"
import type { ReactElement } from "react"

// Chakra components need the app's theme around them.
export const renderWithChakra = (element: ReactElement) => {
    return render(element, { wrapper: Provider })
}
