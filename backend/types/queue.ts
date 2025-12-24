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
