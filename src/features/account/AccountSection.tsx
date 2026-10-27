import { useAuth } from "@account/hooks/useAuth"
import { useSyncStatus } from "@account/hooks/useSyncStatus"
import { AccountPanel } from "./AccountPanel"

// Login, logout and sync status inline, for the phone menu.
export const AccountSection = () => {
    const auth = useAuth()
    const syncStatus = useSyncStatus()

    return <AccountPanel auth={auth} syncStatus={syncStatus} />
}
