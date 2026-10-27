import type { SyncStatus } from "@account/sync/cloudSync"
import { LuCloud, LuCloudAlert, LuCloudUpload } from "react-icons/lu"

type SyncStatusIconProps = {
    status: SyncStatus
}

export const SyncStatusIcon = ({ status }: SyncStatusIconProps) => {
    if (status.state === "error" || status.state === "conflict") {
        return <LuCloudAlert />
    }

    if (status.state === "syncing") {
        return <LuCloudUpload />
    }

    return <LuCloud />
}
