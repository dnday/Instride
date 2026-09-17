export interface Mood {
  id: number;
  user_id: string;
  mood: 1 | 2 | 3 | 4 | 5;
  created_at: string;
}

export interface Journal {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "student" | "counselor";
}