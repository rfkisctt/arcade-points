import { Gamepad2, Medal, CheckCircle } from "lucide-react";
import { Stats } from "@/lib/types";
import { POINT_RULES } from "@/lib/constants";
import { CountingNumber } from "./CountingNumber";
import { useClientTranslation } from "@/lib/useClientTranslation";

export function StatsBar({ stats }: { stats: Stats }) {
  const { t } = useClientTranslation();

  const completionCount = stats.counts["Completion Badge"] ?? 0;

  const items = [
    { icon: Gamepad2, label: t("statsBar.games"), value: stats.counts.Game, pt: stats.counts.Game * POINT_RULES.game, color: "text-white" },
    { icon: Medal, label: t("statsBar.skills"), value: stats.counts["Skill Badge"], pt: Math.floor(stats.counts["Skill Badge"] / POINT_RULES.skillBadgePerPoint), color: "text-[#FCAA26]" },
    ...(completionCount > 0
      ? [{ icon: CheckCircle, label: t("statsBar.completion"), value: completionCount, pt: 0, color: "text-blue-400" }]
      : []),
  ];

  const cols = items.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className={`grid ${cols} border-b border-[rgba(255,255,255,0.05)]`}>
      {items.map(({ icon: Icon, label, value, pt, color }, i) => (
        <div key={label} className={`px-5 py-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
          i < items.length - 1 ? "border-r border-[rgba(255,255,255,0.05)]" : ""
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-[11px] h-[11px] shrink-0 ${color}`} />
            <span className="text-[10px] font-[600] text-[rgba(255,255,255,0.3)] uppercase tracking-wider">{label}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-[700] text-white"><CountingNumber value={value} /></span>
            <span className="text-[10px] font-[500] text-[rgba(255,255,255,0.25)]">{pt > 0 ? `${pt} pt` : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
