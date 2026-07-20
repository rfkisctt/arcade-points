"use client";

import { Trophy, ExternalLink } from "lucide-react";
import { Badge } from "@/lib/types";
import { useClientTranslation } from "@/lib/useClientTranslation";

function getBadgeUrl(badge: Badge): string {
  if (badge.badgeUrl) return badge.badgeUrl;
  return `https://www.cloudskillsboost.google/catalog?keywords=${encodeURIComponent(badge.title)}`;
}

export function BadgeGrid({ badges, searchQuery }: { badges: Badge[]; searchQuery: string; profileUrl?: string }) {
  const { t } = useClientTranslation();
  const filtered = badges.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="px-6 py-[40px] text-center text-[12px] font-[400] text-white/25"
            style={{ fontFamily: "'seasonSans', sans-serif" }}>
        {t("badgeGrid.noMatch", { query: searchQuery })}
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {filtered.map((badge, idx) => (
        <a
          key={idx}
          href={getBadgeUrl(badge)}
          target="_blank"
          rel="noopener noreferrer"
          title={badge.title}
          className="relative flex flex-col items-center text-center p-4 rounded-xl bg-[#161616] border border-white/[0.07] hover:border-white/[0.14] transition-colors duration-200 group"
        >
          <ExternalLink className="absolute top-3 right-3 w-[9px] h-[9px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />

          {badge.imageUrl ? (
            <div className="w-full aspect-square flex items-center justify-center mb-3 p-3">
              <img
                src={badge.imageUrl}
                alt={badge.title}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full aspect-square flex items-center justify-center mb-3 bg-white/[0.03] rounded-lg">
              <Trophy className="w-[28px] h-[28px] text-white/15" />
            </div>
          )}

          <h4
            className="text-[11px] font-[500] text-white/85 line-clamp-2 leading-[16px] w-full"
            style={{ fontFamily: "'seasonSans', sans-serif" }}
          >
            {badge.title}
          </h4>
          <p
            className="text-[10px] font-[400] text-white/25 mt-1.5 leading-none"
            style={{ fontFamily: "'seasonSans', sans-serif" }}
          >
            {badge.dateEarned}
          </p>
          <p
            className="text-[9px] font-[600] text-white/35 mt-1 leading-none uppercase tracking-wider"
            style={{ fontFamily: "'seasonSans', sans-serif" }}
          >
            {badge.category}
          </p>
        </a>
      ))}
    </div>
  );
}
