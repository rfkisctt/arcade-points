"use client";

import { useState } from "react";
import { useClientTranslation } from "@/lib/useClientTranslation";
import { Profile } from "@/lib/types";
import { ExternalLink } from "lucide-react";

interface ProfileCardProps {
  profile: Profile;
  profileUrl?: string;
}

export function ProfileCard({ profile, profileUrl }: ProfileCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const { t } = useClientTranslation();

  const initials = profile.name
    .split(" ")
    .map(w => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const hasAvatar = !!profile.avatarUrl && profile.avatarUrl.trim() !== "" && !imgFailed;

  return (
    <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 flex flex-col items-center justify-center text-center">
      {hasAvatar ? (
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          className="w-[72px] h-[72px] rounded-full mb-4 object-cover border border-white/[0.1]"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="w-[72px] h-[72px] rounded-full mb-4 bg-[#FCAA26]/15 border border-[#FCAA26]/25 flex items-center justify-center shrink-0">
          <span
            className="text-[24px] font-[700] text-[#FCAA26] leading-none"
            style={{ fontFamily: "'seasonMix', sans-serif" }}
          >
            {initials}
          </span>
        </div>
      )}

      <h2
        className="text-[15px] text-white leading-tight break-words mb-1"
        style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
      >
        {profile.name}
      </h2>
      <p
        className="text-[11px] font-[400] text-white/30 mb-3"
        style={{ fontFamily: "'seasonSans', sans-serif" }}
      >
        {t("profileCard.explorerTitle")}
      </p>
      {profileUrl && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-[400] text-white/35 hover:text-[#FCAA26] transition-colors"
          style={{ fontFamily: "'seasonSans', sans-serif" }}
        >
          {t("profileCard.viewProfile")} <ExternalLink className="w-[9px] h-[9px]" />
        </a>
      )}
    </div>
  );
}
