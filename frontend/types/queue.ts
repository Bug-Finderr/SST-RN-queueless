export interface Service {
  id: string;
  name: string;
  description: string;
  avg_service_time_mins: number;
  is_active: boolean;
  current_token: number | null;
  waiting_count: number;
  estimated_wait_mins: number;
}

export interface Token {
  id: string;
  token_number: number;
  user_id: string;
  service_id: string;
  status: "waiting" | "being_served" | "completed" | "skipped" | "canceled";
  created_at: string;
  called_at?: string;
  completed_at?: string;
  service_name: string;
  position_in_queue: number;
  estimated_wait_mins: number;
  notification?: string;
}

export interface TokenNotification {
  token_id: string;
  token_number: number;
  status: string;
  position_in_queue: number;
  message: string;
  is_turn_near: boolean;
}

export interface QueueStatus {
  service_id: string;
  service_name: string;
  current_token: number | null;
  being_served_token_id: string | null;
  waiting_tokens: Array<{
    id: string;
    token_number: number;
    status: string;
    created_at: string;
  }>;
  waiting_count: number;
  avg_service_time_mins: number;
}
