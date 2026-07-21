export type BadgeCategory = "Game" | "Trivia" | "Skill Badge" | "Completion Badge" | "Uncategorized";

export interface Badge {
  title: string;
  dateEarned: string;
  imageUrl: string;
  category: BadgeCategory;
  badgeUrl?: string;
}

export interface Profile {
  name: string;
  avatarUrl: string;
  badges: Badge[];
}

export interface Milestone {
  name: string;
  reqGame: number;
  reqSkill: number;
  bonus: number;
}

export interface Stats {
  counts: Record<BadgeCategory, number>;
  basePoints: number;
  totalPoints: number;
  currentMilestone: Milestone;
  nextMilestone: Milestone | null;
  progressPercent: number;
  gamesToNext: number;
  skillsToNext: number;
  extraBonusPoint: number;
}
