import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@/types";

// Query keys
export const authKeys = {
  user: ["auth", "user"] as const,
};

// API response types
interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Login mutation
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post<AuthResponse>("/api/auth/login", credentials),
    onSuccess: async (data) => {
      await AsyncStorage.setItem("token", data.access_token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      queryClient.setQueryData(authKeys.user, data.user);
    },
  });
}

// Register mutation
export function useRegister() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; name: string }) =>
      api.post<AuthResponse>("/api/auth/register", data),
    onSuccess: async (data) => {
      await AsyncStorage.setItem("token", data.access_token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      queryClient.setQueryData(authKeys.user, data.user);
    },
  });
}

// Logout mutation
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.user, null);
      queryClient.clear();
    },
  });
}

// Current user query - loads from AsyncStorage on app start
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: async (): Promise<User | null> => {
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");
      if (userStr && token) {
        return JSON.parse(userStr) as User;
      }
      return null;
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// Convenience hook for auth state
export function useAuthState() {
  const { data: user, isLoading } = useCurrentUser();

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
