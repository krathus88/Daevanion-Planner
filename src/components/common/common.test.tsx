import { fireEvent, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { renderWithChakra } from "@test/renderWithChakra"
import { CardGrid } from "./CardGrid"
import { ConfirmButton } from "./ConfirmButton"
import { NumberedStep } from "./NumberedStep"
import { PointsField } from "./PointsField"
import { ProgressBar } from "./ProgressBar"
import { SaveForm } from "./SaveForm"
import { ScreenshotDropzone } from "./ScreenshotDropzone"
import { ScreenshotProgress } from "./ScreenshotProgress"
import { Section } from "./Section"
import { StatTile } from "./StatTile"
import { StatusText } from "./StatusText"
import { WholeNumberInput } from "./WholeNumberInput"

describe("SaveForm", () => {
    const setup = (disabled = false) => {
        const onChange = vi.fn()
        const onSave = vi.fn()

        renderWithChakra(
            <SaveForm
                value="My plan"
                disabled={disabled}
                label="Plan name"
                onChange={onChange}
                onSave={onSave}
            />,
        )

        return { onChange: onChange, onSave: onSave }
    }

    it("reports typing", async () => {
        const { onChange } = setup()

        await userEvent.type(screen.getByLabelText("Plan name"), "!")

        expect(onChange).toHaveBeenCalledWith("My plan!")
    })

    it("saves on the button and on Enter", async () => {
        const { onSave } = setup()

        await userEvent.click(screen.getByRole("button", { name: "Save" }))
        await userEvent.type(screen.getByLabelText("Plan name"), "{Enter}")

        expect(onSave).toHaveBeenCalledTimes(2)
    })

    it("doesn't save while disabled, even on Enter", async () => {
        const { onSave } = setup(true)

        expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()

        await userEvent.type(screen.getByLabelText("Plan name"), "{Enter}")

        expect(onSave).not.toHaveBeenCalled()
    })
})

describe("WholeNumberInput", () => {
    const Controlled = () => {
        const [value, setValue] = useState("")

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            setValue(event.target.value)
        }

        return (
            <WholeNumberInput
                value={value}
                aria-label="Number"
                onChange={handleChange}
            />
        )
    }

    it("keeps only digits", () => {
        renderWithChakra(<Controlled />)

        const input = screen.getByLabelText("Number")

        fireEvent.change(input, { target: { value: "1a2-3.4" } })

        expect(input).toHaveValue("1234")
    })

    it("is a text field with a numeric keyboard", () => {
        renderWithChakra(<Controlled />)

        const input = screen.getByLabelText("Number")

        expect(input).toHaveAttribute("type", "text")
        expect(input).toHaveAttribute("inputmode", "numeric")
    })

    it("selects everything on focus, so typing replaces the value", async () => {
        const Filled = () => {
            const [value, setValue] = useState("50")

            const handleChange = (
                event: React.ChangeEvent<HTMLInputElement>,
            ) => {
                setValue(event.target.value)
            }

            return (
                <WholeNumberInput
                    value={value}
                    aria-label="Number"
                    onChange={handleChange}
                />
            )
        }

        renderWithChakra(<Filled />)

        const input = screen.getByLabelText("Number") as HTMLInputElement

        input.focus()

        expect(input.selectionStart).toBe(0)
        expect(input.selectionEnd).toBe(2)
    })

    // A number owned elsewhere, reported on every change, like most fields.
    const Owned = ({ fallback }: { fallback?: number | null }) => {
        const [value, setValue] = useState<number | null>(50)

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            setValue(
                event.target.value === "" ? null : Number(event.target.value),
            )
        }

        return (
            <>
                <WholeNumberInput
                    value={value ?? ""}
                    fallback={fallback}
                    aria-label="Number"
                    onChange={handleChange}
                />

                <output aria-label="Owned">{String(value)}</output>
            </>
        )
    }

    it("selects everything on the first click after focus", async () => {
        renderWithChakra(<Owned />)

        const input = screen.getByLabelText("Number") as HTMLInputElement

        input.focus()
        input.setSelectionRange(1, 1)
        await userEvent.click(input)

        expect(input.selectionStart).toBe(0)
        expect(input.selectionEnd).toBe(2)
    })

    it("stays empty while focused, then reports 0 once left", async () => {
        renderWithChakra(<Owned />)

        const input = screen.getByLabelText("Number")

        await userEvent.clear(input)

        expect(input).toHaveValue("")
        expect(screen.getByLabelText("Owned")).toHaveTextContent("50")

        await userEvent.tab()

        expect(input).toHaveValue("0")
        expect(screen.getByLabelText("Owned")).toHaveTextContent("0")
    })

    it("falls back to its own default", async () => {
        renderWithChakra(<Owned fallback={1} />)

        const input = screen.getByLabelText("Number")

        await userEvent.clear(input)
        await userEvent.tab()

        expect(input).toHaveValue("1")
    })

    it("passes empty on when empty means something", async () => {
        renderWithChakra(<Owned fallback={null} />)

        const input = screen.getByLabelText("Number")

        await userEvent.clear(input)

        expect(screen.getByLabelText("Owned")).toHaveTextContent("null")

        await userEvent.tab()

        expect(input).toHaveValue("")
    })
})

describe("PointsField", () => {
    it("shows the value under its label", () => {
        renderWithChakra(
            <PointsField value={12} label="Points" onChange={() => {}} />,
        )

        expect(screen.getByLabelText("Points")).toHaveValue("12")
    })

    it("reports numbers", async () => {
        const onChange = vi.fn()

        renderWithChakra(
            <PointsField value={0} label="Points" onChange={onChange} />,
        )
        await userEvent.type(screen.getByLabelText("Points"), "7")

        expect(onChange).toHaveBeenLastCalledWith(7)
    })

    it("reads a field left empty as 0", async () => {
        const onChange = vi.fn()

        renderWithChakra(
            <PointsField value={5} label="Points" onChange={onChange} />,
        )
        await userEvent.clear(screen.getByLabelText("Points"))

        expect(onChange).not.toHaveBeenCalled()

        await userEvent.tab()

        expect(onChange).toHaveBeenLastCalledWith(0)
    })

    it("can be disabled", () => {
        renderWithChakra(
            <PointsField
                value={5}
                label="Points"
                disabled
                onChange={() => {}}
            />,
        )

        expect(screen.getByLabelText("Points")).toBeDisabled()
    })
})

describe("Section", () => {
    it("opens and closes from its title", async () => {
        const onOpenChange = vi.fn()

        renderWithChakra(
            <Section title="Details" onOpenChange={onOpenChange}>
                Hidden text
            </Section>,
        )

        const trigger = screen.getByRole("button", { name: /Details/ })

        expect(trigger).toHaveAttribute("aria-expanded", "false")

        await userEvent.click(trigger)

        expect(trigger).toHaveAttribute("aria-expanded", "true")
        expect(onOpenChange).toHaveBeenLastCalledWith(true)
    })

    it("starts open with defaultOpen", () => {
        renderWithChakra(
            <Section title="Details" defaultOpen>
                Shown text
            </Section>,
        )

        expect(screen.getByText("Shown text")).toBeVisible()
    })

    it("shows a count above zero only", () => {
        const { rerender } = renderWithChakra(
            <Section title="Saved" count={3}>
                x
            </Section>,
        )

        expect(screen.getByText("Saved · 3")).toBeInTheDocument()

        rerender(
            <Section title="Saved" count={0}>
                x
            </Section>,
        )

        expect(screen.getByText("Saved")).toBeInTheDocument()
    })

    it("shows what's beside the title", () => {
        renderWithChakra(
            <Section title="Saved" aside={<span>Extra</span>}>
                x
            </Section>,
        )

        expect(
            within(screen.getByRole("button", { name: /Saved/ })).getByText(
                "Extra",
            ),
        ).toBeInTheDocument()
    })
})

describe("ProgressBar", () => {
    it("exposes its value", () => {
        renderWithChakra(<ProgressBar value={40} label="Loading" />)

        expect(screen.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "40",
        )
    })

    it("names the bar after its label", () => {
        renderWithChakra(<ProgressBar value={40} label="Loading" />)

        expect(
            screen.getByRole("progressbar", { name: "Loading" }),
        ).toBeInTheDocument()
    })

    it("stops at 100", () => {
        renderWithChakra(<ProgressBar value={150} label="Loading" />)

        expect(screen.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "100",
        )
    })
})

describe("ScreenshotProgress", () => {
    it("counts the one being read", () => {
        renderWithChakra(<ScreenshotProgress done={1} total={4} />)

        expect(
            screen.getByText("Reading screenshot 2 of 4…"),
        ).toBeInTheDocument()
        expect(screen.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "25",
        )
    })

    it("doesn't count past the total", () => {
        renderWithChakra(<ScreenshotProgress done={4} total={4} />)

        expect(
            screen.getByText("Reading screenshot 4 of 4…"),
        ).toBeInTheDocument()
    })
})

describe("ScreenshotDropzone", () => {
    it("hands picked images over", async () => {
        const onFiles = vi.fn()
        const file = new File(["x"], "shot.png", { type: "image/png" })

        const { container } = renderWithChakra(
            <ScreenshotDropzone onFiles={onFiles} />,
        )
        const input = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement

        await userEvent.upload(input, file)

        expect(onFiles.mock.lastCall?.[0]).toEqual([file])
    })
})

describe("small text components", () => {
    it("StatusText announces politely unless told otherwise", () => {
        const { rerender } = renderWithChakra(<StatusText>Saved</StatusText>)

        expect(screen.getByRole("status")).toHaveTextContent("Saved")

        rerender(<StatusText role="alert">Failed</StatusText>)

        expect(screen.getByRole("alert")).toHaveTextContent("Failed")
    })

    it("StatTile shows its label and value", () => {
        renderWithChakra(<StatTile value={42} label="Spent" />)

        expect(screen.getByText("Spent")).toBeInTheDocument()
        expect(screen.getByText("42")).toBeInTheDocument()
    })

    it("NumberedStep shows its number and text", () => {
        renderWithChakra(
            <ol>
                <NumberedStep step={2}>Do this</NumberedStep>
            </ol>,
        )

        const item = screen.getByRole("listitem")

        expect(item).toHaveTextContent("2")
        expect(item).toHaveTextContent("Do this")
    })
})

describe("CardGrid", () => {
    it("is a section named by its title, with its caption and cards", () => {
        renderWithChakra(
            <CardGrid title="Servers" caption="Shared counts">
                <p>Siel</p>
            </CardGrid>,
        )

        const region = screen.getByRole("region", { name: "Servers" })

        expect(
            within(region).getByRole("heading", { name: "Servers" }),
        ).toBeInTheDocument()
        expect(region).toHaveTextContent("Shared counts")
        expect(region).toHaveTextContent("Siel")
    })
})

describe("ConfirmButton", () => {
    const setup = () => {
        const onConfirm = vi.fn()

        renderWithChakra(
            <ConfirmButton confirmLabel="Remove it" onConfirm={onConfirm}>
                Remove
            </ConfirmButton>,
        )

        return { onConfirm: onConfirm }
    }

    it("asks before doing anything", async () => {
        const { onConfirm } = setup()

        await userEvent.click(screen.getByRole("button", { name: "Remove" }))

        expect(onConfirm).not.toHaveBeenCalled()

        await userEvent.click(screen.getByRole("button", { name: "Remove it" }))

        expect(onConfirm).toHaveBeenCalledTimes(1)
        expect(screen.getByRole("button", { name: "Remove" })).toBeVisible()
    })

    it("can be cancelled", async () => {
        const { onConfirm } = setup()

        await userEvent.click(screen.getByRole("button", { name: "Remove" }))
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

        expect(onConfirm).not.toHaveBeenCalled()
        expect(screen.getByRole("button", { name: "Remove" })).toBeVisible()
    })
})
