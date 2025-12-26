import { Alert } from "react-native";
import { ApiError } from "./api";

/**
 * Show an error alert with consistent formatting.
 * Extracts message from ApiError or uses fallback.
 */
export function showError(
  err: unknown,
  fallback = "Something went wrong",
): void {
  const message = err instanceof ApiError ? err.message : fallback;
  Alert.alert("Error", message);
}
