import { User } from "./User";

export interface Event {
  id: number;
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  location?: string;
  owner_id: number;
  created_at?: string;
  updated_at?: string;
  owner: User;
  pivot?: {
    status: number; // 0: Pending, 1: Accepted, 2: Rejected
  };
  last_message?: {
    id: number;
    content: string;
    user_id: number;
    created_at: string;
    updated_at?: string;
    user?: User;
  };
}