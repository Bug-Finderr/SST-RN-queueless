import { Redirect } from "expo-router";
import { useAuthState } from "@/hooks/use-auth";

export default function Index() {
  const { isAuthenticated } = useAuthState();

  return (
    <Redirect href={isAuthenticated ? "/(tabs)/services" : "/(auth)/login"} />
  );
}
