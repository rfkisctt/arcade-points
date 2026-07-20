"use client";

import { Gamepad2, Medal, ChevronDown, ChevronUp } from "lucide-react";
import { Stats } from "@/lib/types";
import { MILESTONES } from "@/lib/constants";
import { CountingNumber } from "./CountingNumber";
import { useClientTranslation } from "@/lib/useClientTranslation";
import { useLang } from "@/components/Navbar";
import { useState } from "react";
import { COURSES } from "@/lib/courses";

interface Props {
  stats: Stats;
  hasExtraBonus: boolean;
  setHasExtraBonus: (v: boolean) => void;
  earnedBadgeTitles?: string[];
}

function getMissingSkillBadges(
  earnedTitles: string[],
  skillsToNext: number,
  lang: "en" | "id" | string,
  t: (key: string) => string
): { id: string; title: string; url: string; level: string }[] {
  if (skillsToNext <= 0) return [];

  const earnedLower = new Set(earnedTitles.map(t => t.toLowerCase().trim()));

  const skillCourses = COURSES.filter(c => c.category === "Skill Badge");

  const missing = skillCourses.filter(course => {
    const courseTitle = t(course.titleKey).toLowerCase().trim();
    return !earnedLower.has(courseTitle);
  });

  const levelOrder: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  missing.sort((a, b) => {
    const aOrder = levelOrder[a.skillLevel ?? "Intermediate"] ?? 1;
    const bOrder = levelOrder[b.skillLevel ?? "Intermediate"] ?? 1;
    return aOrder - bOrder;
  });

  return missing.slice(0, skillsToNext).map(c => ({
    id: c.id,
    title: t(c.titleKey),
    url: c.url,
    level: c.skillLevel ?? "Beginner",
  }));
}

export function PointsOverview({ stats, hasExtraBonus, setHasExtraBonus, earnedBadgeTitles = [] }: Props) {
  const { t } = useClientTranslation();
  const { lang } = useLang();
  const [showMissingBadges, setShowMissingBadges] = useState(false);

  const missingBadges = getMissingSkillBadges(earnedBadgeTitles, stats.skillsToNext, lang, t);

  const gameProgress = stats.nextMilestone && stats.nextMilestone.reqGame > 0
    ? Math.min(100, (stats.counts.Game / stats.nextMilestone.reqGame) * 100)
    : 100;
  const skillProgress = stats.nextMilestone && stats.nextMilestone.reqSkill > 0
    ? Math.min(100, (stats.counts["Skill Badge"] / stats.nextMilestone.reqSkill) * 100)
    : 100;

  return (
    <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-6 col-span-1 md:col-span-2 flex flex-col justify-between hover:border-[rgba(255,255,255,0.12)] transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <p className="text-[10px] font-[600] text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] mb-2">{t("pointsOverview.totalPoin")}</p>
          <div className="flex flex-wrap items-end gap-3">
            <span className="text-[52px] font-[800] leading-none text-[#FCAA26]">
              <CountingNumber value={stats.totalPoints} duration={1200} />
            </span>
            <span className="text-[11px] font-[500] text-[rgba(255,255,255,0.3)] pb-2">
              {t("pointsOverview.base")}: <CountingNumber value={stats.basePoints} duration={1000} /> · {t("pointsOverview.bonus")}:{" "}
              <CountingNumber value={stats.currentMilestone.bonus + stats.extraBonusPoint} duration={1000} />
            </span>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-full px-3 h-[28px] text-[11px] font-[600] text-white whitespace-nowrap">
            {t(`milestones.${stats.currentMilestone.name}`)}
          </div>

          {stats.currentMilestone.bonus > 0 && (
            <label className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-3 py-[6px] cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              <input
                type="checkbox"
                checked={hasExtraBonus}
                onChange={e => setHasExtraBonus(e.target.checked)}
                className="accent-[#FCAA26] w-[12px] h-[12px] cursor-pointer shrink-0"
              />
              <span className="text-[11px] font-[600] text-[rgba(255,255,255,0.6)] whitespace-nowrap">
                {t("pointsOverview.bonusGear")}
              </span>
            </label>
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[11px] font-[500] mb-2 text-[rgba(255,255,255,0.3)]">
          <span>{t("pointsOverview.target")}: {stats.nextMilestone ? t(`milestones.${stats.nextMilestone.name}`) : t("pointsOverview.maxLevel")}</span>
          {!stats.nextMilestone && <span>{t("pointsOverview.complete")}</span>}
        </div>

        {stats.nextMilestone && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-[90px] shrink-0">
                <Gamepad2 className="w-[10px] h-[10px] shrink-0 text-white/30" />
                <span className="text-[10px] font-[600] text-white/30 uppercase tracking-wider">{t("statsBar.games")}</span>
              </div>
              <div className="flex-1 bg-[rgba(255,255,255,0.04)] rounded-full h-[4px] overflow-hidden">
                <div
                  className="bg-white/40 h-[4px] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${gameProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-[600] text-white/40 w-[60px] text-right shrink-0">
                {stats.gamesToNext === 0
                  ? <span className="text-[#FCAA26]">{stats.counts.Game}/{stats.nextMilestone.reqGame} ✓</span>
                  : <>{stats.counts.Game}/{stats.nextMilestone.reqGame}<span className="text-[#FCAA26] ml-1">−{stats.gamesToNext}</span></>
                }
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-[90px] shrink-0">
                <Medal className="w-[10px] h-[10px] shrink-0 text-[#FCAA26]" />
                <span className="text-[10px] font-[600] text-white/30 uppercase tracking-wider">{t("statsBar.skills")}</span>
              </div>
              <div className="flex-1 bg-[rgba(255,255,255,0.04)] rounded-full h-[4px] overflow-hidden">
                <div
                  className="bg-[#FCAA26]/60 h-[4px] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${skillProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-[600] text-white/40 w-[60px] text-right shrink-0">
                {stats.skillsToNext === 0
                  ? <span className="text-[#FCAA26]">{stats.counts["Skill Badge"]}/{stats.nextMilestone.reqSkill} ✓</span>
                  : <>{stats.counts["Skill Badge"]}/{stats.nextMilestone.reqSkill}<span className="text-[#FCAA26] ml-1">−{stats.skillsToNext}</span></>
                }
              </span>
            </div>

            {stats.skillsToNext > 0 && missingBadges.length > 0 && (
              <div className="mt-1">
                <button
                  onClick={() => setShowMissingBadges(v => !v)}
                  className="flex items-center gap-1.5 text-[10px] font-[600] text-[#FCAA26]/70 hover:text-[#FCAA26] transition-colors"
                >
                  {showMissingBadges ? <ChevronUp className="w-[10px] h-[10px]" /> : <ChevronDown className="w-[10px] h-[10px]" />}
                  {t("pointsOverview.missingBadgesToggle", { count: stats.skillsToNext })}
                </button>

                {showMissingBadges && (
                  <div className="mt-2 flex flex-col gap-1">
                    {missingBadges.map(badge => (
                      <a
                        key={badge.id}
                        href={badge.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[rgba(255,255,255,0.03)] border border-white/[0.05] hover:border-[#FCAA26]/30 hover:bg-[rgba(252,170,38,0.04)] transition-all group"
                      >
                        <span
                          className={`text-[9px] font-[700] px-1.5 py-0.5 rounded shrink-0 ${
                            badge.level === "Beginner"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : badge.level === "Intermediate"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-purple-500/10 text-purple-400"
                          }`}
                        >
                          {badge.level.slice(0, 3).toUpperCase()}
                        </span>
                        <span className="text-[11px] font-[500] text-white/50 group-hover:text-white/80 transition-colors truncate flex-1">
                          {badge.title}
                        </span>
                        <span className="text-[9px] text-white/20 group-hover:text-[#FCAA26]/50 transition-colors shrink-0">↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
