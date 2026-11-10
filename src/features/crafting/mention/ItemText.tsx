import type { TextPart } from "@crafting/logic/textParts"
import { ItemMention } from "./ItemMention"

type ItemTextProps = {
    parts: TextPart[]
}

// Text with its items highlighted (see ItemMention).
export const ItemText = ({ parts }: ItemTextProps) => {
    return parts.map((part, index) =>
        typeof part === "string" ? (
            part
        ) : (
            <ItemMention key={index} item={part} />
        ),
    )
}
