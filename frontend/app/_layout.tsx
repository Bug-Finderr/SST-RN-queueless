import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Loader } from "@/components/ui/Loader";
import { useAuthState } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { isLoading } = useAuthState();

  if (isLoading)
    return <Loader style={{ backgroundColor: colors.background }} />;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="inverted" />
    </>
  );
}
