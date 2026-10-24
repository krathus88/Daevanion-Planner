import { Link } from "@chakra-ui/react"
import type { ReactElement } from "react"

type NavTabProps = {
    children: ReactElement
    isActive: boolean
}

export const NavTab = ({ children, isActive }: NavTabProps) => {
    return (
        <Link
            asChild
            px="4"
            minH={{ base: "10", md: "16" }}
            display="flex"
            alignItems="center"
            borderBottomColor={isActive ? "app.accent" : "transparent"}
            borderBottomWidth="2px"
            color={isActive ? "app.fg" : "app.muted"}
            fontSize="sm"
            fontWeight={isActive ? "semibold" : "medium"}
            textDecoration="none"
            whiteSpace="nowrap"
            _hover={{
                bg: "app.raised",
                color: "app.fg",
                textDecoration: "none",
            }}
        >
            {children}
        </Link>
    )
}
