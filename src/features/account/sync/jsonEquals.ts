import { isRecord } from "@planner/storage/isRecord"

// The database reorders object keys, so stored text can't be compared as is.
export const jsonEquals = (a: unknown, b: unknown): boolean => {
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
            return false
        }

        for (let index = 0; index < a.length; index++) {
            if (!jsonEquals(a[index], b[index])) {
                return false
            }
        }

        return true
    }

    if (isRecord(a) && isRecord(b)) {
        const keys = Object.keys(a)

        if (keys.length !== Object.keys(b).length) {
            return false
        }

        for (const key of keys) {
            if (!Object.hasOwn(b, key) || !jsonEquals(a[key], b[key])) {
                return false
            }
        }

        return true
    }

    return a === b
}
