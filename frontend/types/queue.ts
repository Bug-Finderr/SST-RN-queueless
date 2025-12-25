export interface Service {
  id: string;
  name: string;
  description: string;
  avgServiceTimeMins: number;
  isActive: boolean;
  currentToken: number | null;
  waitingCount: number;
  estimatedWaitMins: number;
}

export interface Token {
  id: string;
  tokenNumber: number;
  userId: string;
  serviceId: string;
  status: "waiting" | "being_served" | "completed" | "skipped" | "canceled";
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  service: { id: string; name: string };
  positionInQueue: number;
  estimatedWaitMins: number;
  notification?: string;
}

export interface TokenNotification {
  tokenId: string;
  tokenNumber: number;
  serviceName: string;
  position: number;
  message: string;
}

export interface QueueStatus {
  serviceId: string;
  currentToken: number | null;
  beingServedTokenId: string | null;
  waitingTokens: Array<{
    id: string;
    tokenNumber: number;
    position: number;
  }>;
  totalWaiting: number;
  totalServed: number;
}
