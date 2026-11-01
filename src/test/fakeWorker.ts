import { act } from "@testing-library/react"
import { vi } from "vitest"

// Stands in for Worker, so a test decides what the worker answers and when.
class FakeWorker {
    static instances: FakeWorker[] = []

    onmessage: ((event: { data: unknown }) => void) | null = null
    onerror: ((event: { message: string }) => void) | null = null
    onmessageerror: (() => void) | null = null
    posted: unknown[] = []
    terminated = false

    constructor() {
        FakeWorker.instances.push(this)
    }

    postMessage(message: unknown) {
        this.posted.push(message)
    }

    terminate() {
        this.terminated = true
    }

    emit(data: unknown) {
        act(() => {
            this.onmessage?.({ data: data })
        })
    }
}

export const installFakeWorker = () => {
    FakeWorker.instances = []
    vi.stubGlobal("Worker", FakeWorker)
}

export const lastWorker = () => {
    return FakeWorker.instances[FakeWorker.instances.length - 1]
}
