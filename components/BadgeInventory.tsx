"use client";

import { Search } from "lucide-react";
import { Profile, Stats } from "@/lib/types";
import { StatsBar } from "./StatsBar";
import { BadgeGrid } from "./BadgeGrid";
import { useLang } from "./Navbar";
import { useClientTranslation } from "@/lib/useClientTranslation";

interface BadgeInventoryProps {
  profile: Profile;
  stats: Stats;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  profileUrl?: string;
}

export function BadgeInventory({ profile, stats, searchQuery, setSearchQuery, profileUrl }: BadgeInventoryProps) {
  const { t } = useClientTranslation();

  return (
    <div className="bg-[#161616] border border-[rgba(255,255,255,0.1)] rounded-[10px] overflow-hidden">
      <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.04)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-[14px] font-[700] text-white">{t("badgeInventory.title")}</h3>
          <p className="text-[12px] font-[600] text-[rgba(255,255,255,0.4)]">{t("badgeInventory.subLabel", { count: profile.badges.length })}</p>
        </div>
        <div className="relative w-full sm:w-[220px]">
          <Search className="w-[12px] h-[12px] absolute left-[12px] top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" />
          <input
            type="text"
            placeholder={t("badgeInventory.searchPh")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-[32px] pr-4 h-[36px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-[8px] text-[12px] font-[600] text-white focus:outline-none focus:border-[#FCAA26] transition-all placeholder:text-[rgba(255,255,255,0.3)]"
          />
        </div>
      </div>
      <StatsBar stats={stats} />
      <BadgeGrid badges={profile.badges} searchQuery={searchQuery} profileUrl={profileUrl} />
    </div>
  );
}
