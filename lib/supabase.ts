import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export interface LeaderboardRow {
  slug:            string;
  name:            string;
  avatar_url:      string;
  total_points:    number;
  base_points:     number;
  milestone_name:  string;
  milestone_bonus: number;
  game_count:      number;
  skill_count:     number;
  trivia_count:    number;
  saved_at:        number;
}

export interface LeaderboardRowFull extends LeaderboardRow {
  id:          string;
  profile_url: string | null;
  owner_token: string | null;
  hidden:      boolean;
}
