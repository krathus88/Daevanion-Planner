import { createRouter, RouterProvider } from "@tanstack/react-router"
import { Provider } from "@ui/provider"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { routeTree } from "./routeTree.gen"

// Set up a Router instance
const router = createRouter({
    routeTree,
    // Matches Vite's `base`, so routes work when hosted under a subpath.
    basepath: import.meta.env.BASE_URL,
    defaultPreload: "intent",
    scrollRestoration: true,
})

// Register things for typesafety
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Provider>
            <RouterProvider router={router} />
        </Provider>
    </StrictMode>,
)
