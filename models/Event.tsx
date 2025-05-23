export interface Profile {
  first_name: string;
  last_name: string;
  description?: string;
  date_of_birth?: string;
  rating: number;
  number_of_ratings: number;
  profile_photo?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  profile: Profile;
}
