import { Button, FileUpload } from "@chakra-ui/react"
import { LuImagePlus } from "react-icons/lu"

type AddScreenshotsButtonProps = {
    onFiles: (files: File[]) => void
}

export const AddScreenshotsButton = ({
    onFiles,
}: AddScreenshotsButtonProps) => {
    const handleFileAccept = (details: FileUpload.FileAcceptDetails) => {
        onFiles(details.files)
    }

    return (
        <FileUpload.Root
            w="auto"
            accept="image/*"
            maxFiles={1000}
            onFileAccept={handleFileAccept}
        >
            <FileUpload.HiddenInput />

            <FileUpload.Trigger asChild>
                <Button variant="ghost" size="sm">
                    <LuImagePlus />
                    Add screenshots
                </Button>
            </FileUpload.Trigger>
        </FileUpload.Root>
    )
}
