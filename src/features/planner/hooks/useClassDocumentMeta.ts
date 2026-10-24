import { CLASS_ICONS, CLASS_NAMES, type ClassId } from "@config/classPresets"
import { useEffect } from "react"

export const useClassDocumentMeta = (classId: ClassId) => {
    const icon = CLASS_ICONS[classId]
    const name = CLASS_NAMES[classId]

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
