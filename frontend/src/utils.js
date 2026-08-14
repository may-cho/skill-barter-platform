// ─── Time Ago ─────────────────────────────────────────────────────
export function timeAgo(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Clean Hours ──────────────────────────────────────────────────
export function formatHours(hours) {
  console.log("Hours", hours);
  if (hours === null || hours === undefined) return "0h";

  const num = typeof hours === "string" ? parseFloat(hours) : hours;

  // Whole number → no decimal
  if (Number.isInteger(num)) return `${num}`;

  // One decimal place max, strip trailing zeros
  return `${parseFloat(num.toFixed(1))}`;
}

// ─── Absolute Date (for tooltips / detail views) ──────────────────
export function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
