import * as v from "valibot"

// Building blocks for reading saved data with Valibot. Saved data is
// forgiving: a bad entry is dropped on its own and a bad field falls back,
// so one broken value never costs the rest.

type ItemSchema = v.GenericSchema<unknown>

// An object, not an array: Valibot's record would take an array too, and
// saved data never means one as an object.
const ANY_RECORD = v.custom<Record<string, unknown>>((value) => {
    return typeof value === "object" && value !== null && !Array.isArray(value)
})

const ANY_ARRAY = v.array(v.unknown())

// A whole number from `min` (and up to `max`, when given).
export const wholeNumber = (min: number, max = Infinity) => {
    return v.pipe(v.number(), v.integer(), v.minValue(min), v.maxValue(max))
}

export const finiteNumber = v.pipe(v.number(), v.finite())

// A key check (e.g. isTimerId) as a schema, so it narrows like the check does.
export const guarded = <T>(isValid: (value: unknown) => value is T) => {
    return v.custom<T>(isValid)
}

// Parses `value` with `schema`, or gives null when it doesn't fit.
export const parseOrNull = <S extends ItemSchema>(
    schema: S,
    value: unknown,
) => {
    const result = v.safeParse(schema, value)

    return result.success ? result.output : null
}

// Entries by `K`: every key for a plain string, else only those listed.
type Entries<K extends string, T> = string extends K
    ? Record<string, T>
    : Partial<Record<K, T>>

// An object, keeping only the entries whose key passes `isKey` and whose
// value parses. Fails for anything else than an object.
export const entriesOf = <S extends ItemSchema, K extends string = string>(
    item: S,
    isKey?: (key: string) => key is K,
) => {
    return v.pipe(
        ANY_RECORD,
        v.transform((record) => {
            const picked: Record<string, v.InferOutput<S>> = {}

            for (const [key, entry] of Object.entries(record)) {
                const parsed = v.safeParse(item, entry)

                if ((!isKey || isKey(key)) && parsed.success) {
                    picked[key] = parsed.output
                }
            }

            return picked as Entries<K, v.InferOutput<S>>
        }),
    )
}

// Like entriesOf, but anything else than an object (or a missing field)
// gives an empty one.
export const validEntries = <S extends ItemSchema, K extends string = string>(
    item: S,
    isKey?: (key: string) => key is K,
) => {
    return v.fallback(entriesOf(item, isKey), () => {
        return {} as Entries<K, v.InferOutput<S>>
    })
}

// A list, keeping only the items that parse. Fails for anything else than
// an array.
export const itemsOf = <S extends ItemSchema>(item: S) => {
    return v.pipe(
        ANY_ARRAY,
        v.transform((list) => {
            const picked: v.InferOutput<S>[] = []

            for (const entry of list) {
                const parsed = v.safeParse(item, entry)

                if (parsed.success) {
                    picked.push(parsed.output)
                }
            }

            return picked
        }),
    )
}

// Like itemsOf, but anything else than an array (or a missing field) gives
// an empty one.
export const validItems = <S extends ItemSchema>(item: S) => {
    return v.fallback(itemsOf(item), () => {
        return [] as v.InferOutput<S>[]
    })
}

// Saved JSON text read with `schema`; missing, unreadable or unfitting text
// gives `fallback`.
export const parseStored = <S extends ItemSchema>(
    schema: S,
    raw: string | null,
    fallback: v.InferOutput<S>,
): v.InferOutput<S> => {
    if (raw === null) {
        return fallback
    }

    try {
        const parsed = v.safeParse(schema, JSON.parse(raw))

        return parsed.success ? parsed.output : fallback
    } catch {
        return fallback
    }
}
