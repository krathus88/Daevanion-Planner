# My instructions

## Working style

- **Ask, don't assume.** If you're not sure what I mean, or a change goes beyond what I asked for, ask me before doing it. Don't pick an interpretation and build it. Ask about vague references (which text, which element) before editing. For bigger redesigns, propose the decisions in a short question first. Only make the changes I actually requested.
- **Ask before adding packages.** Don't reinvent the wheel: if an actively maintained or stable package would replace a lot of hand-written logic, using it is fine. But always ask me before installing any new dependency. Name the package and version, explain why it's worth it over writing the logic ourselves (what it handles, how much code it saves, maintenance status), and include its npm page link (https://www.npmjs.com/package/<name>) in the message text.

## READMEs

Keep READMEs to stable essentials: title, one-line description, live link, install/run commands, license. Leave out anything that changes with the code (feature lists, script tables, folder trees, versions, ports) and anything only the maintainer needs, like deployment. Point to `package.json` instead of listing scripts.

## Chakra UI (v3) and JSX style

Read Chakra v3's LLM docs (https://chakra-ui.com/llms.txt, plus the -styling and -theming variants) before Chakra work.

### Components and props

- Use `<Flex>` instead of `<Box display="flex">`, and `<Grid>` instead of `<Box display="grid">` (same for related layout components). Use `<Flex>` instead of `<Stack>`/`<HStack>`/`<VStack>`.
- Shorthand rule: a shorthand is fine, and preferred, when it abbreviates every word of the full name: `m`, `mt`, `p`, `px`, `bg`, `w`, `h`, `minW`, `maxW`, `flexDir`. It is not fine when it drops a word: use `justifyContent` not `justify`, `alignItems` not `align`, `flexDir`/`flexDirection` not `direction`, `flexWrap` not `wrap`, `borderRadius` not `rounded`, `boxShadow` not `shadow`.
- Always build UI from Chakra components (Collapsible, SegmentGroup, Progress, Image, etc.) instead of raw HTML or hand-rolled widgets. Custom wrapper components built from Chakra parts are fine.

### Theme

- Keep `theme/index.ts` small. Put globalCss, semantic tokens, recipes and similar in their own files (nested further if needed) and import them.
- Prefer reusable theme styles (recipes, slot recipes, layer and text styles) over repeating the same style props across components.
- Use `strictTokens: true`, with every color, shadow and gradient as a theme token. This covers sizes and spacing too: write `w="full"`, not `"100%"`. Do NOT use the `[..]` escape hatch: in Chakra v3 it type-checks but outputs invalid CSS. Add a named token instead (e.g. `sizes.sidebar = "26rem"`, `sizes["1px"]`, `spacing.auto`), and put values computed at runtime in React `style`.

### Formatting

- Put a blank line between sibling JSX children, at every nesting level.
- Order a component's or hook's body as:
  1. router hooks (`useParams`, `useNavigate`, `useRouterState`, ...)
  2. stores, context and custom hooks, plus destructuring their results
  3. `useState`
  4. `useRef`
  5. effects (`useEffectEvent`, `useEffect`)
  6. functions
  7. derived constants

  Exception: a value or hook that another hook takes as input sits directly above that hook, because moving it below would crash the code. Where a strict order doesn't make sense, `// #region Name` / `// #endregion` blocks that group related code are allowed instead.
- Spacing inside a component or hook body:
  - Statements in the same section sit together with no blank line. `useState` and `useRef` count as one section.
  - Put a blank line between different sections and before `return`.
  - Every function, effect and block (`if`, `try`) gets a blank line around it, even next to its own kind.

### Code style

- No shorthand properties in object literals, even when the name matches: write `useX({ preset: preset, total: total })` and `return { selected: selected }`, never `{ preset }`. This applies to every object literal: hook arguments, returned objects, and inline objects like `params={{ id: id }}`. Destructuring patterns (`const { a } = useX()`, `({ a }: Props)`) are bindings, not literals, and stay as they are.
- Never take a bare `props` parameter. Always destructure a component's props in its signature: `({ title, value, onChange }: MyComponentProps)`. Props from a type you extend (e.g. `FlexProps & {...}`) are collected with `...props` at the end, and anything the component reads itself is destructured by name. A pure pass-through wrapper writes `({ ...props }: FlexProps)`.
- Don't destructure an object you already have: a prop, a parameter, or a nested object. Write `allocation.snapshot`, not `const { snapshot } = allocation`. Destructuring a hook's return value is good practice and stays: `const { isLoading, cancel } = useSomething()`. Do destructure, or assign to a variable, when access is deep and repeated, e.g. `const round = team.rounds[0]` rather than `team.rounds[0].phase.intro` again and again.
- No expression-bodied named functions or components. Always use a block body with an explicit `return`: `const f = (x) => { return x + 1 }`, and `const C = () => { return (<Flex />) }`. A function that returns nothing uses plain statements. Inline callbacks passed as arguments (`.map((item) => item.id)`, `.filter(...)`) stay as they are.
- No inline functions in JSX props. Define a named handler (`handleChange`, `handleClick`) before the `return` and pass it: `onClick={handleClick}`. When a handler needs a per-item value inside a `.map`, give the child the value and let it call back with it (e.g. `onChange(item, value)`), or extract a row component that owns the handler. Never define functions after the return or below the component.
- When a component only renders a list, return the `.map(...)` directly (`return items.map((item) => (<Item ... />))`). Don't wrap it in a `<>...</>` fragment. Use a fragment only for several sibling elements.
- Keep logic out of rendering. Data work (geometry, filtering, lookups) goes in plain, typed functions in their own file, written as readable loops. The component then only maps that data to JSX. Avoid nested `flatMap`/`filter`/`map` chains that build JSX deep inside callbacks, `return []` used as "skip", and spreading a string just to loop over its indexes. Shared helpers live in one exported place; never keep private copies in several files.

### Prop ordering

- Order a component's props type, and the destructuring in its signature, as: 1. required values, 2. optional values, 3. required functions, 4. optional functions. Keep the same order in both places. A value that defaults in the destructuring (`size = "md"`) counts as optional. Within each of those four groups, order by importance:
  1. `children`
  2. identity: `id`, `ref`, `role`, `position`
  3. the main data the component shows or edits: `title`, `value`, `item`
  4. appearance and config: `variant`, `mode`, `tone`
  5. state: `open`, `defaultOpen`, `selected`, `disabled`
  6. minor display bits: a plain `label`, `count`, `aside`, `name`

  Functions follow the same idea: the main handler (`onChange`) before secondary ones (`onSave`). Example: `children, title, variant?, open?, defaultOpen?, count?, aside?, onOpenChange?`.
- Order JSX props by meaning, never alphabetically. Don't put blank lines between props. The order is:
  1. identity: `key`, `ref`, `as`, `asChild`, `id`, `className`
  2. component props: `variant`, `size`, `colorPalette`, then data props like `to`, `params`, `src`, `value`, `collection`, sorted by name
  3. position: `pos`, `top`, `right`, `bottom`, `left`, `inset`, `zIndex`
  4. box: margin, then padding, then `boxSize`/`w`/`minW`/`maxW`/`h`/`minH`/`maxH`, then `flex`/`flexShrink`/`alignSelf`, then `style`
  5. layout: `display`, `flexDir`, `flexWrap`, grid templates, `alignItems`, `justifyContent`, `gap`, `overflow`, `objectFit`
  6. background: `layerStyle`, `bg*`, `opacity`
  7. borders: `border*`, `borderRadius`, `boxShadow`, `outline`
  8. text: `textStyle`, `color`, `font*`, `lineHeight`, `textAlign`, `textDecoration`, `textTransform`, `whiteSpace`, `truncate`
  9. effects: `transform`, `filter`, `transition*`, `animation`, `cursor`, `pointerEvents`
  10. conditions: `_hover`, `_disabled`, `css`
  11. behavior: `type`, `disabled`, `open`, `positioning`, `resetScroll`, `tabIndex`
  12. a11y: `role`, `alt`, `title`, `aria-*`, `data-*`
  13. handlers: `on*`

  A spread such as `{...props}` stays where it is, because moving it changes which props win.
- These ordering rules are guidelines for you to follow when writing code. Do NOT add a lint plugin to enforce them.

### File organization

- Strictly one component per file. This includes small private helpers used by only one parent: each gets its own file next to its parent, named after the component. Shared types go in the file that owns them, or in a `types.ts` file.
- Split components early: when a component grows, or a part is its own unit of logic, move it into its own component.
- When a folder gets big, nest related components into subfolders.
- Reusable components don't belong in a feature folder. A component that knows nothing about its feature (no feature context, config, storage or types), such as a card, progress bar, collapsible section, save form, list or icon image, goes in a shared components folder (e.g. `src/components/common/`) and gets a generic name. Keep `components/ui/` for Chakra's own snippets. A feature folder keeps only the pieces tied to that feature.
- Where helpers live: a helper function, type or constant used by only one file can sit at the top of that file. Once several files use it, move it to its own file. Use judgement either way: even single-use code moves out when it would otherwise crowd the file with unrelated logic and the file stops being about one thing. Custom hooks (`hooks/`), standalone algorithms (`logic/`), worker entries and theme parts always get their own files.
- Imports: relative paths only for nearby files: the same folder (`./X`), a child folder (`./sub/X`), or a file directly in the parent (`../X`). Never climb up and then into another folder (`../config/x`, `../../shared/Y`). Use a path alias instead (e.g. `@feature/config/x`), and add a new alias to tsconfig `paths` when no existing one fits. Exception: `new URL("../workers/x.ts", import.meta.url)` must stay relative, because Vite can't resolve aliases there.

### Routing (TanStack Router)

- Nest route files in folders instead of dot-separated names: `routes/$id/$view.tsx`, not `routes/$id.$view.tsx`.
- Use async (code-split) loading for a route only when that section can load on its own: a page users may never visit, or a heavy secondary view. If a route always loads together with the app (every URL lands on it), keep it in the main bundle. With `autoCodeSplitting`, opt a route out with `codeSplitGroupings: []`. Decide case by case.
