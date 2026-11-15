import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Created on import, so it reads the Discord login's return URL before the
// router touches it.
export const supabase = createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { flowType: "implicit" } },
)
