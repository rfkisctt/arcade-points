"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, QrCode, Link2, Check } from "lucide-react";
import { parseProfileHtml, calculateStats } from "@/lib/utils";
import { Profile, Stats } from "@/lib/types";
import { ProfileCard } from "@/components/ProfileCard";
import { BadgeInventory } from "@/components/BadgeInventory";
import { CountingNumber } from "@/components/CountingNumber";
import { useClientTranslation } from "@/lib/useClientTranslation";

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

function PointsOverviewReadonly({ stats }: { stats: Stats }) {
  const { t } = useClientTranslation();

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
            <span className="text-[11px] font-medium text-white/30 pb-2">
              {t("pointsOverview.base")}: <CountingNumber value={stats.basePoints} duration={900} /> · {t("pointsOverview.bonus")}:{" "}
              <CountingNumber value={stats.currentMilestone.bonus + stats.extraBonusPoint} duration={900} />
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
          <span>
            {stats.nextMilestone
              ? [
                  stats.gamesToNext > 0 ? t("pointsOverview.toGoGames", { count: stats.gamesToNext }) : "",
                  stats.skillsToNext > 0 ? t("pointsOverview.toGoSkills", { count: stats.skillsToNext }) : "",
                ].filter(Boolean).join(", ") + " " + t("pointsOverview.toGoSuffix")
              : t("pointsOverview.complete")}
          </span>
        </div>
        <div className="w-full bg-white/[0.05] rounded-full h-[2px] overflow-hidden">
          <div
            className="bg-[#FCAA26] h-[2px] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
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
    } catch {}
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

  const handleDownloadQr = () => {
    const a = document.createElement("a");
    a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&bgcolor=141414&color=FCAA26&data=${encodeURIComponent(url)}`;
    a.download = `qr-profile-${slug}.png`;
    a.click();
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
      } catch {}

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

      const { html } = await profileRes.json();
      const parsed = parseProfileHtml(html);
      setProfile(parsed);
      setStats(calculateStats(parsed, false));
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }, [slug]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
                <span className="text-[11px] text-white/30 pb-2">{t("pointsOverview.base")}: {entry.basePoints}</span>
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
            <PointsOverviewReadonly stats={stats} />
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
