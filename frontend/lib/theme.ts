/**
 * Centralized color constants for the app.
 * Based on Tailwind's color palette.
 */
export const colors = {
  // Primary (indigo)
  primary: "#6366f1",
  primaryLight: "#eef2ff",

  // Semantic
  success: "#10b981",
  successLight: "#d1fae5",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  dangerBorder: "#fecaca",

  // Backgrounds
  background: "#f8fafc",
  backgroundAlt: "#f1f5f9",
  card: "#ffffff",

  // Borders
  border: "#e2e8f0",

  // Text
  text: "#1e293b",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  textLabel: "#475569",

  // Icons/Disabled
  iconMuted: "#cbd5e1",
  gray: "#6b7280",
  grayLight: "#f3f4f6",

  // White (for text on colored backgrounds)
  white: "#ffffff",
} as const;

export type ColorKey = keyof typeof colors;
