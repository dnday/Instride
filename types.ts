
export type UserRole = "mahasiswa" | "konselor" | "admin";

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export type Sentiment = "Positif" | "Negatif" | "Netral";

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  role: UserRole | null;
}

export interface Mood {
  mood_id: number;
  user_id: string;
  mood_value: MoodValue;
  recorded_at: string;
}

export interface Journal {
  journal_id: number;
  user_id: string;
  content: string;
  created_at: string;
}

export interface SentimentAnalysis {
  sentiment_id: number;
  journal_id: number;
  sentiment: Sentiment;
  analyzed_at: string;
}

export interface WellbeingAggregation {
  aggregation_id: number;
  period: string;
  average_mood: number | null;
  positive_percentage: number | null;
  neutral_percentage: number | null;
  negative_percentage: number | null;
}

export interface CampusWellbeingStats {
  period: string;
  average_mood: number;
  total_journals: number;
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
}
