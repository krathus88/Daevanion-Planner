import { CLASS_NAMES, type ClassId } from "@config/classPresets"
import { useEffect } from "react"

export const useClassDocumentMeta = (classId: ClassId) => {
    const name = CLASS_NAMES[classId]

    useEffect(() => {
        document.title = `Daevanion - ${name}`
    }, [name])
}
