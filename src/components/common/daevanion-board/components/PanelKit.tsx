import type { ReactNode } from "react"
import {
    Box,
    Button,
    Flex,
    Input,
    NativeSelect,
    Text,
    type ButtonProps,
    type FlexProps,
} from "@chakra-ui/react"
import { LuChevronRight } from "react-icons/lu"
import { appInputStyles } from "./panelStyles"
import { formatSearchTime, SEARCH_TIME_OPTIONS } from "./searchTime"

export const PrimaryButton = (props: ButtonProps) => (
    <Button
        background="app.accent"
        color="app.accentFg"
        fontWeight="semibold"
        _hover={{ background: "app.accentHover" }}
        _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
        {...props}
    />
)

export const SecondaryButton = (props: ButtonProps) => (
    <Button
        background="app.raised"
        borderColor="app.borderStrong"
        borderWidth="1px"
        color="app.fg"
        _hover={{ background: "app.hover" }}
        _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
        {...props}
    />
)

// Tinted buttons so an action's kind is clear at a glance:
// info = undo, danger = clear/reset.
type Tone = "info" | "danger"

const toneStyles: Record<Tone, ButtonProps> = {
    info: {
        background: "app.infoMuted",
        borderColor: "app.infoBorder",
        color: "app.info",
        _hover: { background: "app.infoStrong" },
    },
    danger: {
        background: "app.dangerMuted",
        borderColor: "app.dangerBorder",
        color: "app.danger",
        _hover: { background: "app.dangerStrong" },
    },
}

export const ToneButton = ({
    tone,
    ...props
}: ButtonProps & { tone: Tone }) => (
    <Button
        borderWidth="1px"
        fontWeight="medium"
        _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
        {...toneStyles[tone]}
        {...props}
    />
)

export const GhostButton = (props: ButtonProps) => (
    <Button
        background="transparent"
        color="app.muted"
        variant="ghost"
        _hover={{ background: "app.hover", color: "app.fg" }}
        {...props}
    />
)

export const SectionLabel = ({ children }: { children: ReactNode }) => (
    <Text
        color="app.subtle"
        fontSize="xs"
        fontWeight="semibold"
        letterSpacing="wider"
        textTransform="uppercase"
    >
        {children}
    </Text>
)

export const Card = (props: FlexProps) => (
    <Flex
        background="app.raised"
        borderColor="app.border"
        borderWidth="1px"
        direction="column"
        gap="3"
        p="4"
        rounded="lg"
        {...props}
    />
)

export const Hint = ({ children }: { children: ReactNode }) => (
    <Text color="app.subtle" fontSize="xs" lineHeight="tall">
        {children}
    </Text>
)

type PointsFieldProps = {
    id: string
    label: string
    value: number
    onChange: (value: number) => void
    disabled?: boolean
}

export const PointsField = ({
    id,
    label,
    value,
    onChange,
    disabled,
}: PointsFieldProps) => (
    <Flex alignItems="center" gap="3" justifyContent="space-between">
        <Text asChild color="app.muted" fontSize="sm">
            <label htmlFor={id}>{label}</label>
        </Text>
        <Input
            {...appInputStyles}
            disabled={disabled}
            id={id}
            min={0}
            onChange={(event) => {
                const next = Number(event.target.value)
                onChange(
                    Number.isFinite(next) ? Math.max(0, Math.floor(next)) : 0,
                )
            }}
            size="sm"
            textAlign="right"
            type="number"
            value={value}
            width="24"
        />
    </Flex>
)

type SaveFormProps = {
    label: string
    value: string
    onChange: (value: string) => void
    onSave: () => void
    disabled: boolean
}

export const SaveForm = ({
    label,
    value,
    onChange,
    onSave,
    disabled,
}: SaveFormProps) => (
    <Flex
        as="form"
        alignItems="center"
        gap="2"
        onSubmit={(event) => {
            event.preventDefault()
            if (!disabled) {
                onSave()
            }
        }}
    >
        <Input
            {...appInputStyles}
            aria-label={label}
            onChange={(event) => onChange(event.target.value)}
            placeholder={label}
            size="sm"
            value={value}
        />
        <SecondaryButton disabled={disabled} size="sm" type="submit">
            Save
        </SecondaryButton>
    </Flex>
)

export type SavedListItem = {
    id: string
    name: string
    detail?: string
    active?: boolean
}

type SavedListProps = {
    title?: string
    items: SavedListItem[]
    empty: string
    loadLabel?: string
    onLoad: (id: string) => void
    onDelete: (id: string) => void
}

export const SavedList = ({
    title,
    items,
    empty,
    loadLabel = "Load",
    onLoad,
    onDelete,
}: SavedListProps) => (
    <Flex direction="column" gap="2">
        {title && (
            <SectionLabel>
                {title}
                {items.length > 0 && ` · ${items.length}`}
            </SectionLabel>
        )}
        {items.length === 0 ? (
            <Hint>{empty}</Hint>
        ) : (
            <Flex direction="column" gap="1.5">
                {items.map((item) => (
                    <Flex
                        alignItems="center"
                        background={
                            item.active ? "app.accentMuted" : "app.raised"
                        }
                        borderColor={item.active ? "app.accent" : "app.border"}
                        borderWidth="1px"
                        gap="2"
                        key={item.id}
                        minWidth="0"
                        px="3"
                        py="2"
                        rounded="md"
                    >
                        <Flex direction="column" flex="1" minWidth="0">
                            <Text
                                fontSize="sm"
                                fontWeight="medium"
                                overflow="hidden"
                                textOverflow="ellipsis"
                                whiteSpace="nowrap"
                            >
                                {item.name}
                            </Text>
                            {item.detail && (
                                <Text color="app.subtle" fontSize="xs">
                                    {item.detail}
                                </Text>
                            )}
                        </Flex>
                        <Flex flexShrink="0" gap="1.5">
                            <SecondaryButton
                                onClick={() => onLoad(item.id)}
                                size="xs"
                            >
                                {item.active ? "Reload" : loadLabel}
                            </SecondaryButton>
                            <GhostButton
                                aria-label={`Delete ${item.name}`}
                                color="app.danger"
                                onClick={() => onDelete(item.id)}
                                size="xs"
                                _hover={{
                                    background: "app.dangerMuted",
                                    color: "app.danger",
                                }}
                            >
                                Delete
                            </GhostButton>
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        )}
    </Flex>
)

type SearchTimeSelectProps = {
    value: number
    onChange: (seconds: number) => void
    size?: "sm" | "md"
}

export const SearchTimeSelect = ({
    value,
    onChange,
    size = "md",
}: SearchTimeSelectProps) => (
    <NativeSelect.Root flexShrink="0" size={size} width="5.5rem">
        <NativeSelect.Field
            {...appInputStyles}
            aria-label="Search time"
            onChange={(event) => onChange(Number(event.target.value))}
            title="How long to search for better routes"
            value={value}
        >
            {SEARCH_TIME_OPTIONS.map((seconds) => (
                <option
                    key={seconds}
                    style={{ backgroundColor: "#1c2230" }}
                    value={seconds}
                >
                    {formatSearchTime(seconds)}
                </option>
            ))}
        </NativeSelect.Field>
    </NativeSelect.Root>
)

type AccordionProps = {
    title: string
    count?: number
    // Read when the section mounts; remount (via key) to apply a new default.
    defaultOpen: boolean
    // "section" is a bordered card; "sub" is a lighter heading inside one.
    variant?: "section" | "sub"
    children: ReactNode
}

export const Accordion = ({
    title,
    count,
    defaultOpen,
    variant = "section",
    children,
}: AccordionProps) => {
    const isSection = variant === "section"

    return (
        <Box
            asChild
            background={isSection ? "app.raised" : "transparent"}
            borderColor="app.border"
            borderWidth={isSection ? "1px" : "0"}
            css={{
                "& > summary::-webkit-details-marker": { display: "none" },
                "&[open] > summary .accordion-chevron": {
                    transform: "rotate(90deg)",
                },
            }}
            rounded="lg"
        >
            <details open={defaultOpen}>
                <Flex
                    as="summary"
                    alignItems="center"
                    cursor="pointer"
                    gap="2"
                    listStyleType="none"
                    px={isSection ? "4" : "0"}
                    py={isSection ? "3" : "1"}
                    userSelect="none"
                    _hover={{ "& .accordion-title": { color: "app.fg" } }}
                >
                    <Box
                        className="accordion-chevron"
                        color="app.muted"
                        display="flex"
                        transition="transform 0.15s ease"
                    >
                        <LuChevronRight size={isSection ? 16 : 14} />
                    </Box>
                    <Text
                        className="accordion-title"
                        color={isSection ? "app.fg" : "app.subtle"}
                        fontSize={isSection ? "sm" : "xs"}
                        fontWeight="semibold"
                        letterSpacing={isSection ? undefined : "wider"}
                        textTransform={isSection ? undefined : "uppercase"}
                    >
                        {title}
                        {count !== undefined && count > 0 && ` · ${count}`}
                    </Text>
                </Flex>
                <Flex
                    direction="column"
                    gap="3"
                    pb={isSection ? "4" : "2"}
                    pt={isSection ? "0" : "1"}
                    px={isSection ? "4" : "0"}
                >
                    {children}
                </Flex>
            </details>
        </Box>
    )
}

type SharedBudgetFieldProps = {
    idPrefix: string
    totalPoints: number
    usedByOtherBoards: number
    availablePoints: number
    onTotalChange: (value: number) => void
    disabled?: boolean
}

// The shared Total points (same value as the All boards tab) and this
// board's share of it.
export const SharedBudgetField = ({
    idPrefix,
    totalPoints,
    usedByOtherBoards,
    availablePoints,
    onTotalChange,
    disabled,
}: SharedBudgetFieldProps) => (
    <Flex direction="column" gap="1.5">
        <PointsField
            disabled={disabled}
            id={`${idPrefix}-total-points`}
            label="Total points (all boards)"
            onChange={onTotalChange}
            value={totalPoints}
        />
        <Flex color="app.subtle" fontSize="xs" justifyContent="space-between">
            <Text>Used by other boards · {usedByOtherBoards}</Text>
            <Text>
                Available here ·{" "}
                <Text as="span" color="app.fg" fontWeight="semibold">
                    {availablePoints}
                </Text>
            </Text>
        </Flex>
    </Flex>
)
