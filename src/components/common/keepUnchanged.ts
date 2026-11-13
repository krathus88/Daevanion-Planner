const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (typeof value !== "object" || value === null) {
        return false
    }

    const prototype: unknown = Object.getPrototypeOf(value)

    return prototype === Object.prototype || prototype === null
}

// `next`, with every part that deep-equals the same part of `previous`
// swapped for previous's own: what didn't change keeps its identity, so memo
// components, compiler memos and useSyncExternalStore readers skip it.
// Returns `previous` itself when nothing changed, and `next` itself when
// nothing of `previous` could be kept. Only plain objects and
// arrays are shared (JSON-like data); anything else counts as changed
// unless it's the very same value.
export const keepUnchanged = <T>(previous: unknown, next: T): T => {
    if (Object.is(previous, next)) {
        return next
    }

    if (Array.isArray(next)) {
        if (!Array.isArray(previous)) {
            return next
        }

        let same = previous.length === next.length
        let allNew = true
        const kept = next.map((item: unknown, index) => {
            const part = keepUnchanged(previous[index], item)

            same &&= part === previous[index]
            allNew &&= part === item

            return part
        })

        if (same) {
            return previous as T
        }

        return allNew ? next : (kept as T)
    }

    if (!isPlainObject(next) || !isPlainObject(previous)) {
        return next
    }

    const keys = Object.keys(next)
    let same = keys.length === Object.keys(previous).length
    let allNew = true
    const kept: Record<string, unknown> = {}

    for (const key of keys) {
        const part = keepUnchanged(previous[key], next[key])

        same &&= part === previous[key] && key in previous
        allNew &&= part === next[key]
        kept[key] = part
    }

    if (same) {
        return previous as T
    }

    // Nothing of the old one kept: `next` as it is.
    return allNew ? next : (kept as T)
}
