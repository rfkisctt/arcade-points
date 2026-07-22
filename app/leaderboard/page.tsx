"use client";

import { Leaderboard } from "@/components/Leaderboard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useClientTranslation } from "@/lib/useClientTranslation";

function getInitialUserId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("arcade_current_user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u.id) return u.id;
    }
  } catch {
  }
  return undefined;
}

export default function LeaderboardPage() {
  const [userId] = useState<string | undefined>(getInitialUserId);
  const { t } = useClientTranslation();

  return (
    <div className="relative z-[1] pt-[72px]">
      <div className="divider" />
      <div className="page-container py-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1
            className="text-[1.75rem] text-white mb-1 tracking-[-0.02em]"
            style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
          >
            {t("leaderboard.title")}
          </h1>
          <p className="text-[13px] font-[400] text-white/55 max-w-[400px]">
            {t("leaderboard.desc")}
          </p>
        </div>
        <Link
          href="/calculate"
          className="flex items-center gap-2 h-[34px] px-4 bg-[#FCAA26] border border-[rgba(252,170,38,0.2)] text-[#141414] rounded-lg text-sm font-semibold hover:bg-[#FFBB3D] transition-colors duration-200 self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          {t("leaderboard.submit")} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="divider" />
      <div className="page-container py-8">
        <Leaderboard highlightId={userId} />
      </div>
    </div>
  );
}
