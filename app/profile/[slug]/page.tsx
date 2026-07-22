"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, QrCode, Link2, Check, Gamepad2, Medal, ChevronDown, ChevronUp } from "lucide-react";
import { calculateStats } from "@/lib/utils";
import { Profile, Stats } from "@/lib/types";
import { ProfileCard } from "@/components/ProfileCard";
import { BadgeInventory } from "@/components/BadgeInventory";
import { CountingNumber } from "@/components/CountingNumber";
import { useClientTranslation } from "@/lib/useClientTranslation";
import { COURSES } from "@/lib/courses";

interface PublicEntry {
  slug: string;
  name: string;
  avatarUrl: string;
  totalPoints: number;
  basePoints: number;
  milestoneName: string;
  milestoneBonus: number;
  gameCount: number;
  skillCount: number;
  triviaCount: number;
  savedAt: number;
  hasProfile: boolean;
}

function getMissingSkillBadgesLocal(
  earnedTitles: string[],
  skillsToNext: number,
  t: (key: string) => string
): { id: string; title: string; url: string; level: string }[] {
  if (skillsToNext <= 0) return [];
  const earnedLower = new Set(earnedTitles.map(s => s.toLowerCase().trim()));
  const levelOrder: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  const missing = COURSES
    .filter(c => c.category === "Skill Badge")
    .filter(c => !earnedLower.has(t(c.titleKey).toLowerCase().trim()))
    .sort((a, b) => (levelOrder[a.skillLevel ?? "Intermediate"] ?? 1) - (levelOrder[b.skillLevel ?? "Intermediate"] ?? 1))
    .slice(0, skillsToNext);
  return missing.map(c => ({ id: c.id, title: t(c.titleKey), url: c.url, level: c.skillLevel ?? "Beginner" }));
}

function PointsOverviewReadonly({ stats, earnedBadgeTitles = [] }: { stats: Stats; earnedBadgeTitles?: string[] }) {
  const { t } = useClientTranslation();
  const [showMissingBadges, setShowMissingBadges] = useState(false);

  const missingBadges = getMissingSkillBadgesLocal(earnedBadgeTitles, stats.skillsToNext, t);

  const gameProgress = stats.nextMilestone && stats.nextMilestone.reqGame > 0
    ? Math.min(100, (stats.counts.Game / stats.nextMilestone.reqGame) * 100)
    : 100;
  const skillProgress = stats.nextMilestone && stats.nextMilestone.reqSkill > 0
    ? Math.min(100, (stats.counts["Skill Badge"] / stats.nextMilestone.reqSkill) * 100)
    : 100;

  return (
    <div className="bg-[#161616] border border-white/[0.08] rounded-[10px] p-6 col-span-1 md:col-span-2 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-2">
            {t("pointsOverview.totalPoin")}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <span className="text-[52px] font-[800] leading-none text-[#FCAA26]">
              <CountingNumber value={stats.totalPoints} duration={1000} />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 h-[28px] text-[11px] font-semibold text-white whitespace-nowrap shrink-0">
          {t(`milestones.${stats.currentMilestone.name}`)}
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[11px] font-medium mb-2 text-white/30">
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
              <div className="flex-1 bg-white/[0.04] rounded-full h-[4px] overflow-hidden">
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
              <div className="flex-1 bg-white/[0.04] rounded-full h-[4px] overflow-hidden">
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
                        className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-white/[0.03] border border-white/[0.05] hover:border-[#FCAA26]/30 hover:bg-[rgba(252,170,38,0.04)] transition-all group"
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

type Status = "loading" | "loading-profile" | "done" | "no-profile" | "error";

function ShareButton({ slug, disabled }: { slug: string; disabled?: boolean }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const url = typeof window !== "undefined" ? `${window.location.origin}/profile/${slug}` : "";

  const handleCopyLink = async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch { /* ignore */ }
  };

  const handleCopyQr = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&bgcolor=141414&color=FCAA26&data=${encodeURIComponent(url)}`;
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      setCopiedQr(true);
      setTimeout(() => setCopiedQr(false), 2000);
    } catch {
      handleDownloadQr();
    }
  };

  const handleDownloadQr = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&bgcolor=141414&color=FCAA26&data=${encodeURIComponent(url)}`;
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `qr-profile-${slug}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&bgcolor=141414&color=FCAA26&data=${encodeURIComponent(url)}`, "_blank");
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleCopyLink}
          disabled={disabled}
          className="flex items-center gap-1.5 h-[28px] px-3 rounded-[7px] border border-white/[0.1] text-[11px] font-[500] text-white/40 hover:text-white hover:border-white/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {copiedLink ? <><Check className="w-[10px] h-[10px]" /> Copied!</> : <><Link2 className="w-[10px] h-[10px]" /> Copy link</>}
        </button>
        <button
          onClick={() => { if (!disabled) { setQrLoading(true); setShowQr(true); } }}
          disabled={disabled}
          className="flex items-center gap-1.5 h-[28px] px-3 rounded-[7px] border border-white/[0.1] text-[11px] font-[500] text-white/40 hover:text-white hover:border-white/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <QrCode className="w-[10px] h-[10px]" /> QR
        </button>
      </div>

      {showQr && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-[#141414] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 w-full max-w-[280px]"
            onClick={e => e.stopPropagation()}
            style={{ fontFamily: "'seasonSans', sans-serif" }}
          >
            <p className="text-[13px] font-[700] text-white">Share Profile</p>
            <div className="w-[200px] h-[200px] relative bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center overflow-hidden">
              {qrLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#141414]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#FCAA26]" />
                </div>
              )}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=141414&color=FCAA26&data=${encodeURIComponent(url)}`}
                alt="QR Code"
                className={`w-[200px] h-[200px] rounded-xl transition-opacity duration-300 ${qrLoading ? "opacity-0" : "opacity-100"}`}
                onLoad={() => setQrLoading(false)}
              />
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={handleCopyQr}
                className="flex-1 h-[34px] bg-[#FCAA26] text-[#141414] rounded-xl text-[12px] font-[600] hover:bg-[#FFBB3D] transition-colors flex items-center justify-center gap-2"
              >
                {copiedQr ? <><Check className="w-[13px] h-[13px]" /> Copied!</> : "Copy QR"}
              </button>
              <button
                onClick={handleDownloadQr}
                className="h-[34px] px-3 bg-white/[0.07] text-white/60 rounded-xl text-[12px] font-[600] hover:bg-white/[0.12] transition-colors flex items-center justify-center"
                title="Download QR"
              >
                ↓
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function ProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { t } = useClientTranslation();

  const [entry, setEntry] = useState<PublicEntry | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (!slug) return;
    if (isRefresh) setStatus("loading-profile");
    else setStatus("loading");
    setErrorMsg("");

    try {
      if (isRefresh) {
        try {
          await fetch(`/api/leaderboard/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
        } catch { /* non-fatal */ }
      }

      const res = await fetch(`/api/leaderboard/by-slug/${slug}`);
      if (!res.ok) {
        setStatus("error");
        setErrorMsg("Profil tidak ditemukan.");
        return;
      }
      const data: PublicEntry = await res.json();

      try {
        const allRes = await fetch("/api/leaderboard");
        if (allRes.ok) {
          const all: PublicEntry[] = await allRes.json();
          const r = all.findIndex(e => e.slug === data.slug) + 1;
          setRank(r > 0 ? r : null);
        }
      } catch { /* rank optional */ }

      setEntry(data);

      if (!data.hasProfile) {
        setStatus("no-profile");
        return;
      }

      const profileRes = await fetch(`/api/profile/${slug}`);
      if (!profileRes.ok) {
        setStatus("no-profile");
        return;
      }

      const { profile: fetchedProfile } = await profileRes.json();
      setProfile(fetchedProfile);
      setStats(calculateStats(fetchedProfile, true));
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }, [slug]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!slug) return;
    const syncKey = `arcade_profile_sync_${slug}`;
    const last = sessionStorage.getItem(syncKey);
    const now = Date.now();
    if (last && now - parseInt(last) < 5 * 60 * 1000) return;
    sessionStorage.setItem(syncKey, String(now));
    fetch(`/api/leaderboard/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  }, [slug]);

  const savedAt = entry?.savedAt
    ? new Date(entry.savedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="relative z-[1] pt-[88px]">
      <div className="divider" />

      <div className="page-container py-3 border-b border-white/[0.06] flex items-center justify-between">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-[12px] font-medium text-white/40 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-3 h-3" />
          {t("profile.backToLeaderboard")}
        </Link>

        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-[10px] font-[400] text-white/20 hidden sm:block">
              {t("profile.updatedAt")} {savedAt}
            </span>
          )}
          <ShareButton slug={slug} disabled={status === "loading" || status === "loading-profile"} />
          <button
            onClick={() => loadProfile(true)}
            disabled={status === "loading" || status === "loading-profile"}
            className="flex items-center gap-1.5 h-[28px] px-3 rounded-[7px] border border-white/[0.1] text-[11px] font-[500] text-white/40 hover:text-white hover:border-white/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-[10px] h-[10px]" />
            Refresh
          </button>
        </div>
      </div>

      {(status === "loading" || status === "loading-profile") && (
        <div className="page-container py-24 flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#FCAA26]" />
          <p className="text-sm font-medium text-white/35">
            {status === "loading-profile" ? t("profile.loadingProfile") : t("profile.loadingData")}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="page-container py-16">
          <div className="max-w-[520px] mx-auto bg-[#161616] border border-red-500/20 rounded-xl px-5 py-5 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400 mb-1">{t("profile.notFound")}</p>
              <p className="text-xs font-medium text-white/40 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        </div>
      )}

      {status === "no-profile" && entry && (
        <div className="page-container py-10">
          {rank && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-semibold text-[#FCAA26] bg-[#FCAA26]/10 border border-[#FCAA26]/20 px-2.5 py-1 rounded-full">
                {t("profile.rankOnLeaderboard", { rank })}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 flex flex-col items-center text-center">
              <img
                src={entry.avatarUrl}
                alt={entry.name}
                referrerPolicy="no-referrer"
                className="w-[72px] h-[72px] rounded-full mb-4 object-cover border border-white/[0.1]"
                onError={e => {
                  const initials = entry.name.split(" ").map((w: string) => w[0] || "").join("").slice(0, 2).toUpperCase();
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1a1a1a&color=fcaa26&size=80&bold=true&format=svg`;
                }}
              />
              <h2 className="text-[15px] font-semibold text-white mb-1">{entry.name}</h2>
              <p className="text-[11px] text-white/30">{t("profileCard.explorerTitle")}</p>
            </div>
            <div className="bg-[#161616] border border-white/[0.08] rounded-xl p-6 col-span-1 md:col-span-2">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">{t("pointsOverview.totalPoin")}</p>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-[52px] font-[800] leading-none text-[#FCAA26]">{entry.totalPoints}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 h-[28px] w-fit text-[11px] font-semibold text-white">
                {t(`milestones.${entry.milestoneName}`)}
              </div>
              <p className="text-[12px] text-white/30 mt-4">{t("profile.noDetail")}</p>
            </div>
          </div>
        </div>
      )}

      {status === "done" && entry && profile && stats && (
        <div className="page-container py-10">
          {rank && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-semibold text-[#FCAA26] bg-[#FCAA26]/10 border border-[#FCAA26]/20 px-2.5 py-1 rounded-full">
                {t("profile.rankOnLeaderboard", { rank })}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <ProfileCard profile={profile} />
            <PointsOverviewReadonly
              stats={stats}
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
          />
        </div>
      )}
    </div>
  );
}
