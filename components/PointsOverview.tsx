"use client";


import { Stats } from "@/lib/types";
import { CountingNumber } from "./CountingNumber";
import { useClientTranslation } from "@/lib/useClientTranslation";

interface Props {
  stats: Stats;
  hasExtraBonus: boolean;
  setHasExtraBonus: (v: boolean) => void;
}

export function PointsOverview({ stats, hasExtraBonus, setHasExtraBonus }: Props) {
  const { t } = useClientTranslation();

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
          <span>
            {stats.nextMilestone
              ? [
                  stats.gamesToNext > 0 ? t("pointsOverview.toGoGames", { count: stats.gamesToNext }) : "",
                  stats.skillsToNext > 0 ? t("pointsOverview.toGoSkills", { count: stats.skillsToNext }) : "",
                ].filter(Boolean).join(", ") + " " + t("pointsOverview.toGoSuffix")
              : t("pointsOverview.complete")}
          </span>
        </div>
        <div className="w-full bg-[rgba(255,255,255,0.05)] rounded-full h-[2px] overflow-hidden">
          <div
            className="bg-[#FCAA26] h-[2px] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
