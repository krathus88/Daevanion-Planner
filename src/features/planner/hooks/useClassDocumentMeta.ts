import type { ClassPreset } from "@config/classPresets"
import { useEffect } from "react"

// Shows the selected class's emblem as the favicon and its name in the title.
export const useClassDocumentMeta = ({ icon, name }: ClassPreset) => {
    useEffect(() => {
        const favicon =
            document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (!favicon) {
            return
        }

        favicon.type = icon ? "image/webp" : "image/svg+xml"
        favicon.href = icon ?? `${import.meta.env.BASE_URL}favicon.svg`
    }, [icon])

    useEffect(() => {
        document.title = `Daevanion - ${name}`
    }, [name])
}
