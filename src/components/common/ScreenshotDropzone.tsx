import { FileUpload, Icon, Text } from "@chakra-ui/react"
import { LuImageUp } from "react-icons/lu"

type ScreenshotDropzoneProps = {
    onFiles: (files: File[]) => void
}

export const ScreenshotDropzone = ({ onFiles }: ScreenshotDropzoneProps) => {
    const handleFileAccept = (details: FileUpload.FileAcceptDetails) => {
        onFiles(details.files)
    }

    return (
        <FileUpload.Root
            w="full"
            alignItems="stretch"
            accept="image/*"
            maxFiles={1000}
            onFileAccept={handleFileAccept}
        >
            <FileUpload.HiddenInput />

            <FileUpload.Dropzone
                minH="40"
                bg="app.inset"
                borderColor="app.borderStrong"
                color="app.fg"
                cursor="button"
                _hover={{ bg: "app.hover" }}
                _dragging={{ bg: "app.accentMuted", borderColor: "app.accent" }}
            >
                <Icon boxSize="8" color="app.accent">
                    <LuImageUp />
                </Icon>

                <FileUpload.DropzoneContent>
                    <Text fontWeight="medium">Drop screenshots here</Text>

                    <Text textStyle="hint">
                        or click to pick them, or paste one with Ctrl+V
                    </Text>
                </FileUpload.DropzoneContent>
            </FileUpload.Dropzone>
        </FileUpload.Root>
    )
}
