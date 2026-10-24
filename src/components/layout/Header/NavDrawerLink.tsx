import { Button } from "@chakra-ui/react"
import type { ReactElement } from "react"

type NavDrawerLinkProps = {
    children: ReactElement
    isActive: boolean
    onNavigate: () => void
}

export const NavDrawerLink = ({
    children,
    isActive,
    onNavigate,
}: NavDrawerLinkProps) => {
    return (
        <Button
            asChild
            variant={isActive ? "secondary" : "ghost"}
            justifyContent="flex-start"
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
        >
            {children}
        </Button>
    )
}
