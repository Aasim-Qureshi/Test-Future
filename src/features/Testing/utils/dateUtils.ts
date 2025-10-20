export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffDays = Math.floor(
        (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const timeString = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    if (diffDays === 0) return `Today, ${timeString}`;
    if (diffDays === 1) return `Yesterday, ${timeString}`;
    return `${diffDays} days ago, ${timeString}`;
}