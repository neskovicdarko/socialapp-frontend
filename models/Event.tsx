import { Category } from "./Category";
import { User } from "./User";

export interface Event {
  id: number;
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  is_completed: boolean;
  owner_id: number;
  category_id?: number;
  category?: Category;
  created_at?: string;
  updated_at?: string;
  owner: User;
  pivot?: {
    status: number;
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
