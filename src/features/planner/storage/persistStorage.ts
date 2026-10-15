let requested = false

// Asks the browser not to clear the site's storage on its own (low disk
// space, Safari's 7-day limit). Called when the user first saves something
// worth keeping, since Firefox asks the user. Once per page load is enough;
// the browser remembers its answer.
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
