import { Section } from "@common/Section"
import { useStorageRevision } from "@planner/storage/storageRevision"
import { BackupFile } from "./BackupFile"
import { ShareLinks } from "./ShareLinks"

export const BackupShareSection = () => {
    const { notice } = useStorageRevision()

    return (
        <Section defaultOpen={notice !== null} title="Backup & share">
            <Section variant="sub" defaultOpen title="Share a link">
                <ShareLinks />
            </Section>

            <Section variant="sub" defaultOpen title="Backup file">
                <BackupFile />
            </Section>
        </Section>
    )
}
