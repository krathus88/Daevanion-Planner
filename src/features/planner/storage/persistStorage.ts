let requested = false

// Called on the first worthwhile save, since Firefox prompts the user.
export const requestPersistentStorage = () => {
    if (requested || !navigator.storage?.persist) {
        return
    }

    requested = true

    navigator.storage
        .persisted()
        .then((persisted) => (persisted ? true : navigator.storage.persist()))
        .catch(() => {})
}
