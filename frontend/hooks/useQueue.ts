import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { QueueStatus, Service, Token, TokenNotification } from "@/types";
import { useAuthState } from "./useAuth";

// Query keys
export const queueKeys = {
  services: ["services"] as const,
  myTokens: ["tokens", "my"] as const,
  notifications: ["tokens", "notifications"] as const,
  queueStatus: (serviceId: string) => ["queue", serviceId] as const,
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

export function useQueueStatus(serviceId: string | null) {
  const { isAuthenticated } = useAuthState();

  return useQuery({
    queryKey: queueKeys.queueStatus(serviceId ?? ""),
    queryFn: () => api.get<QueueStatus>(`/api/tokens/queue/${serviceId}`),
    enabled: isAuthenticated && !!serviceId,
  });
}

// Mutations

export function useBookToken() {
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
  return useMutation({
    mutationFn: (tokenId: string) => api.delete(`/api/tokens/${tokenId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.myTokens });
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
    },
  });
}

export function useCreateService() {
  return useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      avgServiceTimeMins: number;
    }) => api.post("/api/services", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
    },
  });
}

export function useCallNextToken() {
  return useMutation({
    mutationFn: (serviceId: string) =>
      api.post<{
        message: string;
        nextTokenNumber?: number;
        completedPrevious?: boolean;
      }>(`/api/tokens/call-next/${serviceId}`),
    onSuccess: (_, serviceId) => {
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
      queryClient.invalidateQueries({ queryKey: queueKeys.myTokens });
      queryClient.invalidateQueries({
        queryKey: queueKeys.queueStatus(serviceId),
      });
    },
  });
}

export function useCompleteToken() {
  return useMutation({
    mutationFn: (serviceId: string) =>
      api.post<{ message: string; completed: boolean; tokenNumber?: number }>(
        `/api/tokens/complete/${serviceId}`,
      ),
    onSuccess: (_, serviceId) => {
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
      queryClient.invalidateQueries({ queryKey: queueKeys.myTokens });
      queryClient.invalidateQueries({
        queryKey: queueKeys.queueStatus(serviceId),
      });
    },
  });
}

export function useSkipToken() {
  return useMutation({
    mutationFn: (tokenId: string) => api.post(`/api/tokens/skip/${tokenId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.services });
      queryClient.invalidateQueries({ queryKey: queueKeys.myTokens });
      queryClient.invalidateQueries({ queryKey: ["queue"] }); // Invalidate all queue status queries
    },
  });
}
