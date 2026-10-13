export const formatPlanTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })
