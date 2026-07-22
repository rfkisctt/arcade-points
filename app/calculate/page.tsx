"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Check, Link2, ExternalLink } from "lucide-react";
import { Profile, Stats } from "@/lib/types";
import { parseProfileHtml, calculateStats } from "@/lib/utils";
import { ProfileCard } from "@/components/ProfileCard";
import { PointsOverview } from "@/components/PointsOverview";
import { BadgeInventory } from "@/components/BadgeInventory";
import { saveToLeaderboard } from "@/components/Leaderboard";
import { setCurrentUser } from "@/components/Navbar";
import { useClientTranslation } from "@/lib/useClientTranslation";
import { savePointSnapshot, PointsHistory } from "@/components/PointsHistory";


export default function CalculatePage() {
  return (
    <Suspense>
      <CalculatePageInner />
    </Suspense>
  );
}

function CalculatePageInner() {
  const searchParams = useSearchParams();
  const { t } = useClientTranslation();
  const [mounted, setMounted] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasExtraBonus] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const handleFetch = useCallback(async (urlOverride?: string) => {
    const url = (urlOverride ?? profileUrl).trim();
    if (!url) return;
    setLoading(true);
    setError(null);
    setProfile(null);
    setSearchQuery("");
    try {
      const res = await fetch("/api/fetch-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t("calculate.errorTitle"));

      if (result.profile) {
        setProfile(result.profile);
      } else {
        setProfile(parseProfileHtml(result.html));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("navbar.generalError"));
    } finally {
      setLoading(false);
    }
  }, [profileUrl, t]);

  useEffect(() => {
    setMounted(true);
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setProfileUrl(urlParam);
      handleFetch(urlParam);
    }
  }, []);

  useEffect(() => {
    const savedProfile = localStorage.getItem("arcade_last_profile");
    const savedUrl = localStorage.getItem("arcade_last_profile_url");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
        if (savedUrl) setProfileUrl(savedUrl);
      } catch {
      }
    }
  }, []);

  useEffect(() => {
    const load = () => {
      const savedProfile = localStorage.getItem("arcade_last_profile");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setProfile(prev => JSON.stringify(prev) === savedProfile ? prev : parsed);
        } catch {
        }
      }
    };
    window.addEventListener("arcade_user_updated", load);
    return () => window.removeEventListener("arcade_user_updated", load);
  }, []);

  const stats: Stats | null = useMemo(() => {
    if (!profile) return null;
    return calculateStats(profile, hasExtraBonus);
  }, [profile, hasExtraBonus]);

  useEffect(() => {
    if (!profile || !stats) return;
    const trimmedUrl = profileUrl.trim();
    if (!trimmedUrl) return;

    const profileStr = JSON.stringify(profile);
    const statsStr = JSON.stringify(stats);
    const lastProfile = localStorage.getItem("arcade_last_profile");
    const lastStats = localStorage.getItem("arcade_last_stats");
    const lastExtra = localStorage.getItem("arcade_last_extra_bonus");
    if (lastProfile === profileStr && lastStats === statsStr && lastExtra === (hasExtraBonus ? "true" : "false")) return;

    localStorage.setItem("arcade_last_profile", profileStr);
    localStorage.setItem("arcade_last_stats", statsStr);
    localStorage.setItem("arcade_last_profile_url", trimmedUrl);
    localStorage.setItem("arcade_last_extra_bonus", hasExtraBonus ? "true" : "false");

    saveToLeaderboard(trimmedUrl, true).then((result) => {
      if (result.ok && result.profile) {
        const id = trimmedUrl;
        setCurrentUser({ id, name: result.profile.name, avatarUrl: result.profile.avatarUrl, profileUrl: trimmedUrl });
      }
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);

    savePointSnapshot({
      savedAt: Date.now(),
      totalPoints: stats.totalPoints,
      basePoints: stats.basePoints,
      gameCount: stats.counts.Game,
      skillCount: stats.counts["Skill Badge"],
      triviaCount: stats.counts.Trivia,
      milestoneName: stats.currentMilestone.name,
    });
  }, [profile, stats, profileUrl, hasExtraBonus]);

  const steps = [
    {
      n: 1,
      label: t("calculate.step1Label"),
      body: (
        <a
          href="https://www.skills.google/my_account/profile"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] font-[500] bg-white/[0.05] border border-white/[0.06] text-white hover:bg-white/[0.08] px-[10px] py-[4px] rounded-[6px] transition-all"
          style={{ fontFamily: "'seasonSans', monospace" }}
        >
          skills.google/my_account/profile
          <ExternalLink className="w-[10px] h-[10px] opacity-60" aria-hidden="true" />
        </a>
      ),
    },
    {
      n: 2,
      label: t("calculate.step2Label"),
      body: (
        <span className="inline-flex items-center text-[12px] font-[500] bg-white/[0.05] border border-white/[0.06] text-white px-[10px] py-[4px] rounded-[6px]">
          Public Profile
        </span>
      ),
    },
    {
      n: 3,
      label: t("calculate.step3Label"),
      body: (
        <span className="text-[12px] font-[400] text-white/55">
          {t("calculate.step3Body")} <span className="text-white/60 font-[500]">cloudskillsboost.google/public_profiles/…</span>
        </span>
      ),
    },
    {
      n: 4,
      label: t("calculate.step4Label"),
      body: (
        <span className="text-[12px] font-[400] text-white/55">
          {t("calculate.step4Body")} <span className="text-white/70 font-[500]">Profile URL</span> {t("calculate.step4Body2")}
        </span>
      ),
    },
  ];

  void mounted;

  return (
    <div className="relative z-[1] pt-[72px]">

      <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#141414] border border-[#FCAA26]/30 rounded-xl text-[12px] font-[600] text-[#FCAA26] transition-all duration-300 ${savedToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        <Check className="w-[13px] h-[13px]" aria-hidden="true" />
        <span>{t("calculate.saved")}</span>
      </div>

      <div className="divider" />
      <div className="page-container py-10">
        <h1
          className="text-[1.75rem] text-white mb-1 tracking-[-0.02em]"
          style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
        >
          {t("calculate.pageTitle")}
        </h1>
        <p className="text-[13px] font-[400] text-white/55 leading-[21px]">
          {t("calculate.pageDesc")}
        </p>
      </div>
      <div className="divider" />

      <div className="page-container py-10">
        <form onSubmit={e => { e.preventDefault(); handleFetch(); }} className="space-y-3">

          <div className="bg-[#161616] border border-white/[0.08] rounded-xl overflow-hidden">

            <div className="px-5 py-4 border-b border-white/[0.06]">
              <span className="text-[10px] font-[600] text-white/50 uppercase tracking-[0.16em]">
                {t("calculate.howToGet")}
              </span>
            </div>

            <div className="px-5 py-5 border-b border-white/[0.06] space-y-0">
              {steps.map((step, i, arr) => {
                const isLast = i === arr.length - 1;
                return (
                  <div key={step.n} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-[20px] h-[20px] rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-[9px] font-[700] text-white/50 shrink-0">
                        {step.n}
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-white/[0.06] my-1" />}
                    </div>
                    <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-4"}`}>
                      <p className="text-[10px] font-[600] text-white/50 uppercase tracking-wider mb-1.5"
                         style={{ fontFamily: "'seasonSans', sans-serif" }}>
                        {step.label}
                      </p>
                      <div>{step.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-5">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-[10px] h-[10px] text-white/50" aria-hidden="true" />
                <span className="text-[10px] font-[600] text-white/50 uppercase tracking-[0.16em]"
                      style={{ fontFamily: "'seasonSans', sans-serif" }}>
                  {t("calculate.profileUrlLabel")}
                </span>
              </div>
              <input
                type="url"
                id="profile-url"
                name="profile-url"
                aria-label={t("calculate.profileUrlLabel")}
                className="w-full bg-transparent border-0 border-b border-white/[0.1] pb-2.5 text-[14px] font-[400] text-white focus:outline-none focus:border-[#FCAA26] transition-colors duration-200 placeholder:text-white/20"
                style={{ fontFamily: "'seasonSans', sans-serif" }}
                placeholder="https://www.cloudskillsboost.google/public_profiles/..."
                value={profileUrl}
                onChange={e => setProfileUrl(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !profileUrl.trim()}
            className="w-full h-[40px] bg-[#FCAA26] text-[#141414] rounded-xl text-[13px] font-[600] hover:bg-[#FFBB3D] active:bg-[#E67A00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            style={{ fontFamily: "'seasonSans', sans-serif" }}
          >
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /><span>{t("calculate.analyzing")}</span></>
              : <><Check className="w-3.5 h-3.5" aria-hidden="true" /><span>{t("calculate.analyze")}</span></>
            }
          </button>

          {error && (
            <div className="bg-[#161616] border border-red-500/20 rounded-xl px-4 py-4 flex items-start gap-3" role="alert">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-[1px]" aria-hidden="true" />
              <div>
                <p className="text-[12px] font-[600] text-red-400 mb-1">{t("calculate.errorTitle")}</p>
                <p className="text-[12px] font-[400] text-white/55 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </form>
      </div>

      {profile && stats && (
        <>
          <div className="divider" />
          <div className="page-container py-10">
            <div className="flex items-center justify-between gap-2 mb-6">
              <span
                className="text-[10px] font-[600] text-white/50 uppercase tracking-[0.16em]"
                style={{ fontFamily: "'seasonSans', sans-serif" }}
              >
                {t("calculate.resultLabel")}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <ProfileCard profile={profile} profileUrl={profileUrl.trim() || undefined} />
              <PointsOverview
                stats={stats}
                hasExtraBonus={hasExtraBonus}
                earnedBadgeTitles={profile.badges
                  .filter(b => b.category === "Skill Badge")
                  .map(b => b.title)}
              />
            </div>
            <BadgeInventory
              profile={profile}
              stats={stats}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              profileUrl={profileUrl.trim() || undefined}
            />
            <PointsHistory currentPoints={stats.totalPoints} />
          </div>
        </>
      )}
    </div>
  );
}
