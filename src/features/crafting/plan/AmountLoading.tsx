import { Skeleton, type SkeletonProps } from "@chakra-ui/react"

// Where a Kinah sum or cost goes while market prices load: it would still
// change.
export const AmountLoading = (props: SkeletonProps) => {
    return (
        <Skeleton
            display="inline-block"
            w="16"
            h="4"
            verticalAlign="middle"
            borderRadius="sm"
            aria-label="Loading prices"
            aria-busy
            {...props}
        />
    )
}
