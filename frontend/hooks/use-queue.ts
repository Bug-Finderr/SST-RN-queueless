import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Service, Token, TokenNotification } from "@/types";
import { useAuthState } from "./use-auth";

// Query keys
export const queueKeys = {
  services: ["services"] as const,
  myTokens: ["tokens", "my"] as const,
  notifications: ["tokens", "notifications"] as const,
};

// Queries

export function useServices() {
  return useQuery({
    queryKey: queueKeys.services,
    queryFn: () => api.get<Service[]>("/api/services"),
    refetchInterval: 10000, // Poll every 10s for live updates
  });
}

export function useMyTokens() {
  const { isAuthenticated } = useAuthState();

  return useQuery({
    queryKey: queueKeys.myTokens,
    queryFn: () => api.get<Token[]>("/api/tokens/my"),
    enabled: isAuthenticated,
    refetchInterval: 10000, // Poll every 10s for live updates
  });
}

export function useNotifications() {
  const { isAuthenticated } = useAuthState();

  return useQuery({
    queryKey: queueKeys.notifications,
    queryFn: () => api.get<TokenNotification[]>("/api/tokens/notifications"),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
}

// Mutations

export function useBookToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) =>
      api.post<Token>(`/api/tokens/book?service_id=${serviceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.myTokens });
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
    },
  });
}

export function useCancelToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tokenId: string) => api.delete(`/api/tokens/${tokenId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.myTokens });
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      avg_service_time_mins: number;
    }) => api.post("/api/services", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
    },
  });
}

export function useCallNextToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) =>
      api.post<{
        message: string;
        token_number?: number;
        completed_previous?: boolean;
      }>(`/api/tokens/call-next/${serviceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
      queryClient.invalidateQueries({ queryKey: queueKeys.myTokens });
    },
  });
}

export function useCompleteToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) =>
      api.post<{ message: string; completed: boolean; token_number?: number }>(
        `/api/tokens/complete/${serviceId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
      queryClient.invalidateQueries({ queryKey: queueKeys.myTokens });
    },
  });
}

export function useSkipToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tokenId: string) => api.post(`/api/tokens/skip/${tokenId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
      queryClient.invalidateQueries({ queryKey: queueKeys.myTokens });
    },
  });
}
