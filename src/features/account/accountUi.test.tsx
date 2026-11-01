import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { AccountPanel } from "./AccountPanel"
import type { AuthState } from "./auth"
import { SyncConflictDialog } from "./conflict/SyncConflictDialog"
import type { SyncStatus } from "./sync/cloudSync"
import { PETS_KEY, TIMERS_KEY } from "./sync/syncedKeys"

const mocks = vi.hoisted(() => {
    return {
        signIn: vi.fn(),
        signOut: vi.fn(),
        retrySync: vi.fn(),
        openSyncConflict: vi.fn(),
        closeSyncConflict: vi.fn(),
        resolveSyncConflict: vi.fn(),
    }
})

vi.mock("./auth", () => {
    return { signIn: mocks.signIn, signOut: mocks.signOut }
})

vi.mock("./sync/cloudSync", () => {
    return {
        retrySync: mocks.retrySync,
        openSyncConflict: mocks.openSyncConflict,
        closeSyncConflict: mocks.closeSyncConflict,
        resolveSyncConflict: mocks.resolveSyncConflict,
    }
})

const SIGNED_IN: AuthState = {
    status: "signedIn",
    userId: "u",
    name: "Krathus",
    isReporter: false,
}

const panel = (auth: AuthState, status: SyncStatus = { state: "off" }) => {
    return renderWithChakra(<AccountPanel auth={auth} syncStatus={status} />)
}

beforeEach(() => {
    for (const mock of Object.values(mocks)) {
        mock.mockReset()
    }
})

describe("AccountPanel: signed out", () => {
    it("shows nothing while loading", () => {
        panel({ status: "loading" })

        expect(screen.queryByRole("button")).toBeNull()
    })

    it("offers a Discord login", async () => {
        panel({ status: "signedOut", error: null })

        await userEvent.click(
            screen.getByRole("button", { name: "Log in with Discord" }),
        )

        expect(mocks.signIn).toHaveBeenCalled()
    })

    it("says why a login was refused", () => {
        panel({ status: "signedOut", error: "Not on the list" })

        expect(screen.getByText("Not on the list")).toBeInTheDocument()
    })
})

describe("AccountPanel: signed in", () => {
    it("shows the name and logs out", async () => {
        panel(SIGNED_IN, { state: "synced" })

        expect(screen.getByText("Krathus")).toBeInTheDocument()
        expect(
            screen.getByText(
                "Plans, pets and timer settings are saved to your account.",
            ),
        ).toBeInTheDocument()

        await userEvent.click(screen.getByRole("button", { name: "Log out" }))

        expect(mocks.signOut).toHaveBeenCalled()
    })

    it("shows syncing", () => {
        panel(SIGNED_IN, { state: "syncing" })

        expect(screen.getByText("Syncing…")).toBeInTheDocument()
    })

    it("explains an error and retries", async () => {
        panel(SIGNED_IN, { state: "error", message: "offline" })

        expect(screen.getByText("Couldn't sync: offline")).toBeInTheDocument()

        await userEvent.click(screen.getByRole("button", { name: "Try again" }))

        expect(mocks.retrySync).toHaveBeenCalled()
    })

    it("reopens the choice for a conflict", async () => {
        panel(SIGNED_IN, { state: "conflict", conflicts: [], open: false })

        await userEvent.click(
            screen.getByRole("button", { name: "Choose what to keep" }),
        )

        expect(mocks.openSyncConflict).toHaveBeenCalled()
    })
})

describe("SyncConflictDialog", () => {
    const conflicts = [
        {
            key: PETS_KEY,
            device: { levels: { 1: 1 } },
            deviceTime: 1,
            account: { levels: { 1: 1, 2: 1 } },
            accountTime: 2,
        },
        {
            key: TIMERS_KEY,
            device: {},
            deviceTime: undefined,
            account: {},
            accountTime: 2,
        },
    ]

    const dialog = (open = true) => {
        return renderWithChakra(
            <SyncConflictDialog conflicts={conflicts} open={open} />,
        )
    }

    it("compares both sides per group", async () => {
        dialog()

        expect(await screen.findByText("Pets")).toBeInTheDocument()
        expect(screen.getByText("1 pet with levels")).toBeInTheDocument()
        expect(screen.getByText("2 pets with levels")).toBeInTheDocument()
        expect(screen.getByText("Saved before sync")).toBeInTheDocument()
    })

    it.each([
        ["Keep this device", "device"],
        ["Keep account", "account"],
        ["Merge both", "merge"],
    ])("%s resolves with %s", async (name, choice) => {
        dialog()

        await userEvent.click(await screen.findByRole("button", { name: name }))

        expect(mocks.resolveSyncConflict).toHaveBeenCalledWith(choice)
    })

    it("closing leaves the choice for later", async () => {
        dialog()

        await userEvent.click(
            await screen.findByRole("button", { name: /close/i }),
        )

        expect(mocks.closeSyncConflict).toHaveBeenCalled()
        expect(mocks.resolveSyncConflict).not.toHaveBeenCalled()
    })

    it("stays hidden until open", () => {
        dialog(false)

        expect(screen.queryByRole("dialog")).toBeNull()
    })
})
