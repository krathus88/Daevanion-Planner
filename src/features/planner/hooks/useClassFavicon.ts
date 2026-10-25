import { CLASS_ICONS, type ClassId } from "@config/classPresets"
import { useEffect } from "react"

export const useClassFavicon = (classId: ClassId) => {
    const icon = CLASS_ICONS[classId]

    useEffect(() => {
        const favicon =
            document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (!favicon) {
            return
        }

        favicon.type = "image/webp"
        favicon.href = icon
    }, [icon])
}
