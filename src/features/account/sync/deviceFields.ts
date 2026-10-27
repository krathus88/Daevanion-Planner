import { isRecord } from "@planner/storage/isRecord"
import { TIMERS_KEY } from "./syncedKeys"

// Fields of a synced value that stay on each device: the pinned timers in the
// top bar and the Coming next strip suit one screen, not every device.
const DEVICE_FIELDS: Record<string, string[]> = {
    [TIMERS_KEY]: [
        "pinned",
        "showPinned",
        "comingNext",
        "showComingNext",
        "comingNextCount",
        "comingNextPosition",
    ],
}

// The part of a value the account keeps.
export const toAccountValue = (key: string, value: unknown) => {
    const fields = DEVICE_FIELDS[key]

    if (!fields || !isRecord(value)) {
        return value
    }

    const shared = { ...value }

    for (const field of fields) {
        delete shared[field]
    }

    return shared
}

// An account value with this device's own fields put back.
export const withDeviceFields = (
    key: string,
    value: unknown,
    local: unknown,
) => {
    const fields = DEVICE_FIELDS[key]

    if (!fields || !isRecord(value)) {
        return value
    }

    const merged = { ...value }

    for (const field of fields) {
        delete merged[field]

        if (isRecord(local) && Object.hasOwn(local, field)) {
            merged[field] = local[field]
        }
    }

    return merged
}
