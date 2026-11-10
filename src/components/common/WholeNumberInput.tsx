import { Input, type InputProps } from "@chakra-ui/react"
import {
    useRef,
    useState,
    type ChangeEvent,
    type FocusEvent,
    type MouseEvent,
} from "react"

export type WholeNumberInputProps = InputProps & {
    // What an emptied field turns into once left (0 unless given). Null makes
    // empty a value of its own (like "no limit"), passed on as typed.
    fallback?: number | null
}

// Text field, not type="number", so typing over a 0 gives "5", not "05".
// Focusing selects the whole value, and so does the first click after it, so
// typing replaces it. Emptying it leaves it empty while focused; leaving it
// empty reports the fallback.
export const WholeNumberInput = ({
    fallback = 0,
    value,
    onChange,
    onFocus,
    onBlur,
    onMouseUp,
    ...props
}: WholeNumberInputProps) => {
    const [emptied, setEmptied] = useState(false)
    // A click right after focus (or autoFocus) would drop the selection.
    const selectOnClick = useRef(false)

    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
        const input = event.currentTarget

        input.select()
        // Again next frame: a mouse click can clear the selection on mouseup.
        requestAnimationFrame(() => input.select())
        selectOnClick.current = true
        onFocus?.(event)
    }

    // Clicking inside a selection places the caret on mouseup, after the
    // click handlers, so the selection is kept by cancelling that.
    const handleMouseUp = (event: MouseEvent<HTMLInputElement>) => {
        if (selectOnClick.current) {
            selectOnClick.current = false
            event.preventDefault()
            event.currentTarget.select()
        }

        onMouseUp?.(event)
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const digits = event.target.value.replace(/\D/g, "")

        if (digits !== event.target.value) {
            event.target.value = digits
        }

        selectOnClick.current = false

        // Held back until the field is left, so the owner doesn't show its
        // fallback while the user is still typing.
        if (digits === "" && fallback !== null) {
            setEmptied(true)

            return
        }

        setEmptied(false)
        onChange?.(event)
    }

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        selectOnClick.current = false

        if (emptied) {
            setEmptied(false)
            event.currentTarget.value = String(fallback)
            // Owners only read the input's value, so the blur stands in for
            // the change that never came.
            onChange?.(event as unknown as ChangeEvent<HTMLInputElement>)
        }

        onBlur?.(event)
    }

    return (
        <Input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={emptied ? "" : value}
            onFocus={handleFocus}
            onMouseUp={handleMouseUp}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
        />
    )
}
