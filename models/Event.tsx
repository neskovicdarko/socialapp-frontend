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
}