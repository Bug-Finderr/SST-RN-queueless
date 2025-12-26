import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { QueueStatus, Service, Token, TokenNotification } from "@/types";
import { useAuthState } from "./useAuth";

const POLLING = {
  services: 10_000,
  tokens: 10_000,
  notifications: 30_000,
} as const;

// Query keys
export const queueKeys = {
  services: ["services"] as const,
  myTokens: ["tokens", "my"] as const,
  notifications: ["tokens", "notifications"] as const,
  queueStatus: (serviceId: string) => ["queue", serviceId] as const,
};

// Shared invalidation helper
const invalidateQueueData = (serviceId?: string) => {
  queryClient.invalidateQueries({ queryKey: queueKeys.myTokens });
  queryClient.invalidateQueries({ queryKey: queueKeys.services });
  if (serviceId)
    queryClient.invalidateQueries({
      queryKey: queueKeys.queueStatus(serviceId),
    });
};

// Queries

export function useServices() {
  return useQuery({
    queryKey: queueKeys.services,
    queryFn: () => api.get<Service[]>("/api/services"),
    refetchInterval: POLLING.services,
  });
}

export function useMyTokens() {
  const { isAuthenticated } = useAuthState();
  return useQuery({
    queryKey: queueKeys.myTokens,
    queryFn: () => api.get<Token[]>("/api/tokens/my"),
    enabled: isAuthenticated,
    refetchInterval: POLLING.tokens,
  });
}

export function useNotifications() {
  const { isAuthenticated } = useAuthState();
  const { data: tokens } = useMyTokens();

  // Only poll if user has tokens near their turn (position <= 5)
  const hasNearTokens = tokens?.some(
    (t) => t.status === "waiting" && (t.positionInQueue ?? 0) <= 5,
  );

  return useQuery({
    queryKey: queueKeys.notifications,
    queryFn: () => api.get<TokenNotification[]>("/api/tokens/notifications"),
    enabled: isAuthenticated && hasNearTokens,
    refetchInterval: hasNearTokens ? POLLING.notifications : false,
  });
}

export function useQueueStatus(serviceId: string | null) {
  const { isAuthenticated } = useAuthState();
  return useQuery({
    queryKey: queueKeys.queueStatus(serviceId ?? ""),
    queryFn: () => api.get<QueueStatus>(`/api/tokens/queue/${serviceId}`),
    enabled: isAuthenticated && !!serviceId,
    refetchInterval: POLLING.tokens,
  });
}

// Mutations

export function useBookToken() {
  return useMutation({
    mutationFn: (serviceId: string) =>
      api.post<Token>(`/api/tokens/book?service_id=${serviceId}`),
    onSuccess: (_, serviceId) => invalidateQueueData(serviceId),
  });
}

export function useCancelToken() {
  return useMutation({
    mutationFn: (tokenId: string) => api.delete(`/api/tokens/${tokenId}`),
    onSuccess: () => {
      invalidateQueueData();
      queryClient.invalidateQueries({ queryKey: ["queue"] });
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queueKeys.services }),
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
    onSuccess: (_, serviceId) => invalidateQueueData(serviceId),
  });
}

export function useCompleteToken() {
  return useMutation({
    mutationFn: (serviceId: string) =>
      api.post<{ message: string; completed: boolean; tokenNumber?: number }>(
        `/api/tokens/complete/${serviceId}`,
      ),
    onSuccess: (_, serviceId) => invalidateQueueData(serviceId),
  });
}

export function useSkipToken() {
  return useMutation({
    mutationFn: (tokenId: string) => api.post(`/api/tokens/skip/${tokenId}`),
    onSuccess: () => {
      invalidateQueueData();
      queryClient.invalidateQueries({ queryKey: ["queue"] }); // All queue status queries
    },
  });
}
