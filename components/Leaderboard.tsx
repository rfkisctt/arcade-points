"use client";

import { Crown, RefreshCw, Search, Trash2, ArrowUpRight, Gamepad2, HelpCircle, Medal, Download, BarChart2, ChevronDown, EyeOff, Eye } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLang } from "./Navbar";
import { useClientTranslation } from "@/lib/useClientTranslation";

export const ADMIN_SESSION_KEY = "arcade_admin_session";

export interface LeaderboardEntry {
  id: string;
  slug?: string;
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
  profileUrl?: string;
  hidden?: boolean;
}

export async function saveToLeaderboard(profileUrl: string, hasExtraBonus: boolean = false): Promise<{
  ok: boolean;
  slug?: string;
  ownerToken?: string;
  profile?: { name: string; avatarUrl: string; badges: unknown[] };
  stats?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileUrl, hasExtraBonus }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.slug) {
        try { localStorage.setItem("arcade_my_slug", data.slug); } catch {}
      }
      if (data.ownerToken) {
        try { localStorage.setItem("arcade_owner_token", data.ownerToken); } catch {}
      }
      return { ok: true, slug: data.slug, ownerToken: data.ownerToken, profile: data.profile, stats: data.stats };
    }
    return { ok: false, error: data.error || 'Server error.' };
  } catch (e) {
    console.error("Failed to save to leaderboard", e);
    return { ok: false, error: 'Network error.' };
  }
}

async function fetchLeaderboard(adminSecret?: string): Promise<LeaderboardEntry[]> {
  try {
    const headers: HeadersInit = {};
    if (adminSecret) headers["x-admin-secret"] = adminSecret;
    const res = await fetch("/api/leaderboard", { cache: "no-store", headers });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-[26px] h-[26px] rounded-full bg-[rgba(255,135,9,0.1)] border border-[rgba(255,135,9,0.25)] flex items-center justify-center">
      <Crown className="w-[11px] h-[11px] text-[#FCAA26]" />
    </div>
  );
  return (
    <div className="w-[26px] h-[26px] flex items-center justify-center">
      <span className={`text-[12px] font-[700] ${rank <= 3 ? "text-white/60" : "text-white/25"}`}>
        {rank}
      </span>
    </div>
  );
}

const CACHE_KEY = "arcade_leaderboard_cache";

function getCachedEntries(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw || raw.trim() === "" || raw.trim() === "undefined" || raw.trim() === "null") return [];
    return JSON.parse(raw);
  } catch {
    try { localStorage.removeItem(CACHE_KEY); } catch {}
    return [];
  }
}

function setCachedEntries(data: LeaderboardEntry[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

function ConfirmDeleteModal({
  name, onConfirm, onCancel, loading,
}: { name: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  const { t } = useClientTranslation();
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onCancel}>
      <div className="w-full max-w-[360px] bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-[0_24px_64px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()} style={{ fontFamily: "'seasonSans', sans-serif" }}>
        <p className="text-[14px] font-[700] text-white mb-2">{t("leaderboardComponent.modalDeleteTitle")}</p>
        <p className="text-[12px] font-[400] text-white/50 mb-5 leading-relaxed">{t("leaderboardComponent.modalDeleteBody", { name })}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 h-[36px] bg-white/[0.06] text-white/60 text-[12px] font-[500] rounded-xl hover:bg-white/[0.1] transition-colors">{t("leaderboardComponent.modalCancel")}</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 h-[36px] bg-red-500 text-white text-[12px] font-[600] rounded-xl hover:bg-red-400 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5">
            {loading ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("leaderboardComponent.modalDeleting")}</> : <><Trash2 className="w-[12px] h-[12px]" />{t("leaderboardComponent.modalConfirmDelete")}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteAllModal({
  count, onConfirm, onCancel, loading,
}: { count: number; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  const { t } = useClientTranslation();
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={onCancel}>
      <div className="w-full max-w-[360px] bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-[0_24px_64px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()} style={{ fontFamily: "'seasonSans', sans-serif" }}>
        <p className="text-[14px] font-[700] text-white mb-2">{t("leaderboardComponent.modalDeleteAllTitle")}</p>
        <p className="text-[12px] font-[400] text-white/50 mb-5 leading-relaxed">
          {t("leaderboardComponent.modalDeleteAllBody", { count })}
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 h-[36px] bg-white/[0.06] text-white/60 text-[12px] font-[500] rounded-xl hover:bg-white/[0.1] transition-colors">{t("leaderboardComponent.modalCancel")}</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 h-[36px] bg-red-500 text-white text-[12px] font-[600] rounded-xl hover:bg-red-400 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5">
            {loading ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("leaderboardComponent.modalDeleting")}</> : <><Trash2 className="w-[12px] h-[12px]" />{t("leaderboardComponent.modalDeleteAllConfirm")}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: "points", label: "Points" },
  { value: "games",  label: "Games"  },
  { value: "skills", label: "Skills" },
  { value: "trivia", label: "Trivia" },
] as const;

function SortDropdown({ value, onChange }: {
  value: "points" | "games" | "skills" | "trivia";
  onChange: (v: "points" | "games" | "skills" | "trivia") => void;
}) {
  const { t } = useClientTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const current = SORT_OPTIONS.find(o => o.value === value)!;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-[6px] h-[32px] px-3 rounded-[8px] text-[12px] font-[600] border transition-all duration-200 bg-[#141414] border-white/[0.08] text-white/40 hover:text-white hover:border-white/[0.2]"
      >
        {t("leaderboardComponent.sortPrefix")} {t(`leaderboardComponent.sort${value.charAt(0).toUpperCase() + value.slice(1)}`)}
        <ChevronDown className={`w-[10px] h-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 bg-[#141414] border border-white/[0.08] rounded-[8px] min-w-[130px] py-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-[6px] text-[12px] font-[600] transition-colors duration-150 ${value === opt.value ? "text-[#FCAA26]" : "text-white/70 hover:bg-[rgba(255,255,255,0.04)] hover:text-white"}`}
            >
              {t(`leaderboardComponent.sort${opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}`)}
              {value === opt.value && <span className="w-[5px] h-[5px] rounded-full bg-[#FCAA26] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MILESTONE_ORDER = ["Belum Milestone", "Milestone 1", "Milestone 2", "Milestone 3", "Ultimate"];

function MilestoneDropdown({ options, value, onChange }: {
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const { t } = useClientTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const sorted = [...options].sort((a, b) => {
    const ai = MILESTONE_ORDER.indexOf(a);
    const bi = MILESTONE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const isActive = value !== null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-[6px] h-[32px] px-3 rounded-[8px] text-[12px] font-[600] border transition-all duration-200 ${isActive ? "bg-[#FCAA26] border-[rgba(252,170,38,0.2)] text-[#0A0A0A]" : "bg-[#141414] border-white/[0.08] text-white/40 hover:text-white hover:border-white/[0.2]"}`}
      >
        {value ? t(`milestones.${value}`) : "Milestone"}
        <ChevronDown className={`w-[10px] h-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 bg-[#141414] border border-white/[0.08] rounded-[8px] min-w-[160px] py-1">
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-[6px] text-[12px] font-[600] transition-colors duration-150 ${!value ? "text-[#FCAA26]" : "text-white/70 hover:bg-[rgba(255,255,255,0.04)] hover:text-white"}`}
          >
            {t("leaderboardComponent.filterAll")}
            {!value && <span className="w-[5px] h-[5px] rounded-full bg-[#FCAA26] shrink-0" />}
          </button>
          {sorted.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-[6px] text-[12px] font-[600] transition-colors duration-150 ${value === opt ? "text-[#FCAA26]" : "text-white/70 hover:bg-[rgba(255,255,255,0.04)] hover:text-white"}`}
            >
              {t(`milestones.${opt}`)}
              {value === opt && <span className="w-[5px] h-[5px] rounded-full bg-[#FCAA26] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Leaderboard({ highlightId }: { highlightId?: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "games" | "skills" | "trivia">("points");
  const [filterMilestone, setFilterMilestone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);  const [mounted, setMounted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mySlug, setMySlug] = useState<string | undefined>(undefined);
  const [myPrevRank, setMyPrevRank] = useState<number | null>(null);
  const [rankUpToast, setRankUpToast] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [showAdminStats, setShowAdminStats] = useState(false);
  const [toggleHiddenLoading, setToggleHiddenLoading] = useState<string | null>(null);
  const [resyncLoading, setResyncLoading] = useState(false);
  const [resyncResult, setResyncResult] = useState<string | null>(null);
  const { lang } = useLang();
  const { t } = useClientTranslation();

  const signedOutRef = useRef<{ slug?: string; name?: string } | null>(null);

  const resolveMySlug = useCallback(() => {
    const slug = localStorage.getItem("arcade_my_slug");
    if (slug) { setMySlug(slug); return; }
    try {
      const raw = localStorage.getItem("arcade_current_user");
      if (raw && raw.trim() !== "" && raw.trim() !== "undefined") {
        const u = JSON.parse(raw);
        if (u.name) setMySlug(`__name__${u.name}`);
      }
    } catch {}
  }, []);

  const load = useCallback(async (secret?: string) => {
    const data = await fetchLeaderboard(secret ?? adminSecret);
    const so = signedOutRef.current;
    const filtered = so
      ? data.filter(e => {
          if (so.slug && e.slug === so.slug) return false;
          if (so.name && e.name === so.name) return false;
          return true;
        })
      : data;
    if (so) {      const stillInServer = data.some(e =>
        (so.slug && e.slug === so.slug) || (so.name && e.name === so.name)
      );
      if (!stillInServer) signedOutRef.current = null;
    }
    setEntries(filtered);
    setCachedEntries(filtered);
    setLastUpdated(new Date());
    setLoading(false);
    setInitialLoad(false);
    resolveMySlug();
    try {
      const mySlugStored = localStorage.getItem("arcade_my_slug");
      if (mySlugStored) {
        const isNameFallback = mySlugStored.startsWith("__name__");
        const myName = isNameFallback ? mySlugStored.slice(8) : null;

      if (!isNameFallback) {
          const newRank = data.findIndex(e => e.slug === mySlugStored) + 1;
          if (newRank > 0) {
            setMyPrevRank(prev => {
              if (prev !== null && newRank < prev) {
                setRankUpToast(newRank);
                setTimeout(() => setRankUpToast(null), 4000);
              }
              return newRank;
            });
          }
        }

        const stillExists = isNameFallback
          ? data.some(e => e.name === myName)
          : data.some(e => e.slug === mySlugStored);

        const isVisibleLocal = localStorage.getItem("arcade_leaderboard_visible") !== "false";

        if (isVisibleLocal && !stillExists) {
          window.dispatchEvent(new Event("arcade_user_removed_by_admin"));
        }
      }
    } catch {}
  }, [adminSecret, resolveMySlug]);

  useEffect(() => {
    setMounted(true);
    const cached = getCachedEntries();
    if (cached.length > 0) {
      setEntries(cached);
      setLoading(false);
    }
    resolveMySlug();
    const secret = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (secret) { setAdminSecret(secret); setIsAdmin(true); }

    const onAdminLogin = () => {
      const s = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (s) { setAdminSecret(s); setIsAdmin(true); load(s); }
    };
    const onAdminLogout = () => { setAdminSecret(""); setIsAdmin(false); load(""); };
    window.addEventListener("arcade_admin_login", onAdminLogin);
    window.addEventListener("arcade_admin_logout", onAdminLogout);
    return () => {
      window.removeEventListener("arcade_admin_login", onAdminLogin);
      window.removeEventListener("arcade_admin_logout", onAdminLogout);
    };
  }, [load, resolveMySlug]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), 10000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const RESYNC_KEY = 'arcade_last_resync';
    const RESYNC_INTERVAL = 2 * 60 * 60 * 1000;
    const last = sessionStorage.getItem(RESYNC_KEY);
    const now = Date.now();
    if (last && now - parseInt(last) < RESYNC_INTERVAL) return;
    const secret = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!secret) return;
    sessionStorage.setItem(RESYNC_KEY, String(now));
    fetch('/api/leaderboard/resync', {
      method: 'POST',
      headers: { 'x-admin-secret': secret },
    }).catch(() => {/* silent */});
  }, []);

  useEffect(() => {
    const onReload = (e: Event) => {
      const detail = (e as CustomEvent<{ slug?: string; name?: string; refetch?: boolean }>).detail;
      const slug = detail?.slug;
      const name = detail?.name;
      const refetchOnly = detail?.refetch && !slug && !name;

      if (refetchOnly) {
        load();
        return;
      }

      setMySlug(undefined);
      signedOutRef.current = { slug: slug || undefined, name: name || undefined };
      setEntries(prev => {
        let next: typeof prev;
        if (slug && slug.length > 0) {
          next = prev.filter(entry => entry.slug !== slug);
        } else if (name && name.length > 0) {
          next = prev.filter(entry => entry.name !== name);
        } else {
          next = [];
        }
        setCachedEntries(next);
        return next;
      });
    };
    window.addEventListener("arcade_leaderboard_reload", onReload);
    return () => window.removeEventListener("arcade_leaderboard_reload", onReload);
  }, [load]);

  const filtered = entries
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    .filter(e => filterMilestone ? e.milestoneName === filterMilestone : true)
    .sort((a, b) => {
      if (sortBy === "games") return b.gameCount - a.gameCount;
      if (sortBy === "skills") return b.skillCount - a.skillCount;
      if (sortBy === "trivia") return b.triviaCount - a.triviaCount;
      return b.totalPoints - a.totalPoints;
    });

  const milestoneOptions = Array.from(new Set(entries.map(e => e.milestoneName))).sort();

  const handleExportCsv = () => {
    const headers = ["#", "Participant", "Game", "Trivia", "Skill", "Points", "Milestone"];
    const rows = entries.map((e, i) => [i + 1, e.name, e.gameCount, e.triviaCount, e.skillCount, e.totalPoints, e.milestoneName]);

    const thStyle = `padding:6px 10px;text-align:center;font-weight:bold;white-space:nowrap`;
    const tdCenter = `padding:5px 10px;text-align:center;white-space:nowrap`;
    const tdLeft = `padding:5px 10px;text-align:left`;

    const tableRows = [
      `<tr>${headers.map(h => `<th style="${thStyle}">${h}</th>`).join("")}</tr>`,
      ...rows.map(r =>
        `<tr>${r.map((v, ci) => `<td style="${ci === 1 ? tdLeft : tdCenter}">${v}</td>`).join("")}</tr>`
      ),
    ].join("");

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Leaderboard</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table style="border-collapse:collapse;font-family:sans-serif;font-size:12px">${tableRows}</table></body></html>`;

    const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leaderboard-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const avgPoints = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.totalPoints, 0) / entries.length) : 0;
  const milestoneCounts = entries.reduce((acc, e) => { acc[e.milestoneName] = (acc[e.milestoneName] || 0) + 1; return acc; }, {} as Record<string, number>);

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminSecret("");
    setIsAdmin(false);
    window.dispatchEvent(new Event("arcade_admin_logout"));
  };

  const handleDelete = async () => {
    if (!deleteTarget || !adminSecret) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/leaderboard/by-slug/${encodeURIComponent(deleteTarget.slug)}`, {
        method: "DELETE",
        headers: { "x-admin-secret": adminSecret },
      });
      if (!res.ok) handleAdminLogout();
      setDeleteTarget(null);
      load();
    } catch { /* silent */ }
    setDeleteLoading(false);
  };

  const handleDeleteAll = async () => {
    if (!adminSecret) return;
    setDeleteAllLoading(true);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "DELETE",
        headers: { "x-admin-secret": adminSecret },
      });
      if (!res.ok) handleAdminLogout();
      setDeleteAllConfirm(false);
      load();
    } catch { /* silent */ }
    setDeleteAllLoading(false);
  };

  const handleToggleHidden = async (entry: LeaderboardEntry) => {
    if (!adminSecret || !entry.slug) return;
    setToggleHiddenLoading(entry.slug);
    const nextHidden = !entry.hidden;
    try {
      const res = await fetch("/api/leaderboard/visibility", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({ slug: entry.slug, hidden: nextHidden }),
      });
      if (res.ok) {
        setEntries(prev => prev.map(e =>
          e.slug === entry.slug ? { ...e, hidden: nextHidden } : e
        ));
      } else {
        handleAdminLogout();
      }
    } catch { /* silent */ }
    setToggleHiddenLoading(null);
  };

  const handleResyncAll = async () => {
    if (!adminSecret || resyncLoading) return;
    setResyncLoading(true);
    setResyncResult(null);
    try {
      const res = await fetch("/api/leaderboard/resync", {
        method: "POST",
        headers: { "x-admin-secret": adminSecret },
      });
      const data = await res.json();
      if (res.ok) {
        setResyncResult(`✓ ${data.updated} updated, ${data.failed} failed`);
        load(); // refresh leaderboard
      } else {
        if (!res.ok && res.status === 401) handleAdminLogout();
        setResyncResult(`✗ ${data.error || 'Failed'}`);
      }
    } catch { setResyncResult("✗ Network error"); }
    setResyncLoading(false);
    setTimeout(() => setResyncResult(null), 8000);
  };

  return (
    <>
      {rankUpToast !== null && typeof document !== "undefined" && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-5 py-3 bg-[#141414] border border-[#FCAA26]/30 rounded-xl text-[13px] font-[700] text-[#FCAA26] shadow-[0_8px_32px_rgba(0,0,0,0.7)] transition-all duration-500 animate-bounce-once">
          {t("leaderboardComponent.rankUpToast", { rank: rankUpToast })}
        </div>,
        document.body
      )}

      {deleteTarget && createPortal(
        <ConfirmDeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />,
        document.body
      )}
      {deleteAllConfirm && createPortal(
        <ConfirmDeleteAllModal
          count={entries.length}
          onConfirm={handleDeleteAll}
          onCancel={() => setDeleteAllConfirm(false)}
          loading={deleteAllLoading}
        />,
        document.body
      )}

      <div className="bg-[#161616] border border-white/[0.08] rounded-[10px] overflow-hidden">
        {/* Admin stats panel */}
        {isAdmin && showAdminStats && (
          <div className="px-5 py-3 bg-[#161616] border-b border-white/[0.06] flex flex-wrap gap-4 items-center">
            <span className="text-[11px] font-[600] text-white/50">{t("leaderboardComponent.adminStatsLabel", { total: entries.length, avg: avgPoints })}</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(milestoneCounts).sort((a,b) => b[1]-a[1]).map(([name, count]) => (
                <span key={name} className="text-[10px] font-[500] text-white/30 bg-[#141414] border border-white/[0.06] px-2 py-0.5 rounded-full">
                  {name}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Arcade Points" className="w-[18px] h-[18px] object-contain" />
            <span className="text-[13px] font-[700] text-white">{t("leaderboardComponent.ranking")}</span>
            <span className="text-[10px] font-[600] text-white/30 bg-[#141414] border border-white/[0.07] px-[10px] py-[3px] rounded-full">
              {t("leaderboardComponent.participants", { count: entries.length })}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {lastUpdated && (
              <span className="text-[10px] font-[400] text-white/20 hidden sm:block" style={{ fontFamily: "'seasonSans', sans-serif" }}>
                {t("leaderboardComponent.updated")} {lastUpdated.toLocaleTimeString(lang === "id" ? "id-ID" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <SortDropdown value={sortBy} onChange={setSortBy} />
            <MilestoneDropdown options={milestoneOptions} value={filterMilestone} onChange={setFilterMilestone} />
            <div className="relative">
              <Search className="w-[11px] h-[11px] absolute left-[10px] top-1/2 -translate-y-1/2 text-white/25" />
              <input type="text" placeholder={t("leaderboardComponent.searchPh")} value={search} onChange={e => setSearch(e.target.value)}
                className="h-[32px] pl-[28px] pr-3 bg-[#141414] border border-white/[0.08] rounded-[8px] text-[11px] font-[400] text-white focus:outline-none focus:border-[#FCAA26] transition-colors placeholder:text-white/20 w-[140px]" />
            </div>
            <button
              onClick={() => { setLoading(true); load(); }}
              className="w-[32px] h-[32px] flex items-center justify-center rounded-[8px] bg-[#141414] border border-white/[0.08] text-white/30 hover:text-white hover:border-white/[0.2] transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-[11px] h-[11px] ${loading ? "animate-spin" : ""}`} />
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={handleExportCsv}
                  className="h-[32px] px-3 flex items-center gap-1.5 rounded-[8px] bg-[#141414] border border-white/[0.08] text-[10px] font-[500] text-white/40 hover:text-white hover:border-white/[0.2] transition-all"
                  title="Export CSV"
                >
                  <Download className="w-[10px] h-[10px]" /> CSV
                </button>
                <button
                  onClick={() => setShowAdminStats(s => !s)}
                  className={`w-[32px] h-[32px] flex items-center justify-center rounded-[8px] border transition-all ${showAdminStats ? "bg-[#FCAA26]/10 border-[#FCAA26]/20 text-[#FCAA26]" : "bg-[#141414] border-white/[0.08] text-white/30 hover:text-white hover:border-white/[0.2]"}`}
                  title="Admin stats"
                >
                  <BarChart2 className="w-[11px] h-[11px]" />
                </button>
                <button
                  onClick={() => setDeleteAllConfirm(true)}
                  className="w-[32px] h-[32px] flex items-center justify-center rounded-[8px] bg-[#141414] border border-white/[0.08] text-red-400/40 hover:text-red-400 hover:border-red-500/30 transition-all"
                  title="Hapus semua data leaderboard"
                >
                  <Trash2 className="w-[11px] h-[11px]" />
                </button>
                <button
                  onClick={handleResyncAll}
                  disabled={resyncLoading}
                  className={`h-[32px] px-3 flex items-center gap-1.5 rounded-[8px] border text-[10px] font-[600] transition-all ${resyncLoading ? "bg-[#FCAA26]/10 border-[#FCAA26]/20 text-[#FCAA26] cursor-not-allowed" : resyncResult ? (resyncResult.startsWith("✓") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400") : "bg-[#141414] border-white/[0.08] text-white/40 hover:text-[#FCAA26] hover:border-[#FCAA26]/30"}`}
                  title="Re-sync all profiles from Google"
                >
                  <RefreshCw className={`w-[10px] h-[10px] ${resyncLoading ? "animate-spin" : ""}`} />
                  {resyncResult ? resyncResult : resyncLoading ? "Syncing..." : "Resync All"}
                </button>
              </>
            )}
          </div>
        </div>

        {(filtered.length > 0 || initialLoad) && (
          <div className={`px-5 py-3 grid gap-3 border-b border-white/[0.04] ${isAdmin ? "grid-cols-[32px_1fr_40px_40px_40px_56px_96px_28px]" : "grid-cols-[32px_1fr_40px_40px_40px_56px_96px]"}`}>
            <span className="text-[10px] font-[600] text-white/25 uppercase tracking-wider">#</span>
            <span className="text-[10px] font-[600] text-white/25 uppercase tracking-wider">{t("leaderboardComponent.colParticipant")}</span>
            <div className="flex justify-end" title="Game"><Gamepad2 className="w-[11px] h-[11px] text-white/25" /></div>
            <div className="flex justify-end" title="Trivia"><HelpCircle className="w-[11px] h-[11px] text-white/25" /></div>
            <div className="flex justify-end" title="Skill Badge (count)"><Medal className="w-[11px] h-[11px] text-white/25" /></div>
            <span className="text-[10px] font-[600] text-white/25 uppercase tracking-wider text-center">{t("leaderboardComponent.colPoints")}</span>
            <span className="text-[10px] font-[600] text-white/25 uppercase tracking-wider text-center">{t("leaderboardComponent.colMilestone")}</span>
            {isAdmin && <span />}
          </div>
        )}

        {initialLoad ? (
          <div className="w-full flex flex-col gap-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`px-5 py-4 grid grid-cols-[32px_1fr_40px_40px_40px_56px_96px] gap-3 items-center border-b border-white/[0.03] last:border-0`}>
                  <div className="w-[26px] h-[26px] rounded-full bg-white/[0.04] animate-pulse" />
                  <div className="flex items-center gap-3">
                    <div className="w-[30px] h-[30px] rounded-full bg-white/[0.04] animate-pulse shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="h-[10px] rounded-full bg-white/[0.04] animate-pulse" style={{ width: `${55 + (i * 13) % 30}%` }} />
                      <div className="h-[8px] rounded-full bg-white/[0.03] animate-pulse w-[40%]" />
                    </div>
                  </div>
                  <div className="h-[10px] rounded-full bg-white/[0.04] animate-pulse ml-auto w-[20px]" />
                  <div className="h-[10px] rounded-full bg-white/[0.03] animate-pulse ml-auto w-[16px]" />
                  <div className="h-[10px] rounded-full bg-white/[0.04] animate-pulse ml-auto w-[20px]" />
                  <div className="h-[22px] rounded-full bg-white/[0.04] animate-pulse mx-auto w-[40px]" />
                  <div className="h-[22px] rounded-full bg-white/[0.03] animate-pulse mx-auto w-[80px]" />
                </div>
              ))}
            </div>
        ) : filtered.length === 0 ? (
          <div className="py-[48px] text-center">
            <p className="text-[12px] font-[400] text-white/25">{entries.length === 0 ? t("leaderboardComponent.empty") : t("leaderboardComponent.noMatch", { name: search })}</p>
          </div>
        ) : (
          <>
            {filtered.slice(0, 10).map(entry => {
              const rank = entries.findIndex(e => e.slug === entry.slug) + 1;
              const isMe = !!mySlug && (
                mySlug.startsWith("__name__")
                  ? entry.name === mySlug.slice(8)
                  : entry.slug === mySlug
              );
              return (
                <div
                  key={entry.slug || entry.name}
                  className={`group px-5 py-4 grid gap-3 items-center border-b border-white/[0.03] last:border-0 transition-colors duration-150 ${isAdmin ? "grid-cols-[32px_1fr_40px_40px_40px_56px_96px_28px]" : "grid-cols-[32px_1fr_40px_40px_40px_56px_96px]"} ${isMe ? "bg-[rgba(255,135,9,0.04)] border-l-2 border-l-[#FCAA26]" : entry.hidden ? "bg-[rgba(255,255,255,0.01)] opacity-50" : "hover:bg-white/[0.02]"}`}
                >
                  <RankCell rank={rank} />
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={entry.avatarUrl} alt={entry.name} referrerPolicy="no-referrer"
                      className="w-[30px] h-[30px] rounded-full object-cover border border-white/[0.08] shrink-0"
                      onError={e => {
                        const initials = entry.name.split(" ").map((w: string) => w[0] || "").join("").slice(0, 2).toUpperCase();
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1a1a1a&color=fcaa26&size=60&bold=true&format=svg`;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${entry.slug || entry.name}`} className="text-[12px] font-[600] text-white hover:text-[#FCAA26] transition-colors duration-200 truncate block">{entry.name}</Link>
                        {isAdmin && entry.hidden && (
                          <span title="Hidden from leaderboard" className="shrink-0 flex items-center">
                            <EyeOff className="w-[12px] h-[12px] text-white/40" />
                          </span>
                        )}
                      </div>
                      <Link href={`/profile/${entry.slug || entry.name}`} className="flex items-center gap-[3px] text-[10px] font-[400] text-white/25 hover:text-[#FCAA26] transition-colors">
                        {t("leaderboardComponent.viewProfile")} <ArrowUpRight className="w-[8px] h-[8px]" />
                      </Link>
                    </div>
                  </div>
                  <p className="text-[11px] font-[500] text-white/40 text-right">{entry.gameCount}</p>
                  <p className="text-[11px] font-[500] text-white/40 text-right">{entry.triviaCount}</p>
                  <p className="text-[11px] font-[500] text-white/40 text-right">{entry.skillCount}</p>
                  <p className="text-[13px] font-[700] text-[#FCAA26] text-center">{entry.totalPoints}</p>
                  <p className="text-[10px] font-[500] text-white/35 bg-[#141414] border border-white/[0.06] px-[8px] py-[3px] rounded-full whitespace-nowrap overflow-hidden text-ellipsis text-center mx-auto">
                    {t(`milestones.${entry.milestoneName}`)}
                  </p>
                  {isAdmin && (
                    <button onClick={() => setDeleteTarget({ slug: entry.slug!, name: entry.name })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-red-400/70 hover:text-red-400 flex items-center justify-center shrink-0"
                      title={`Hapus ${entry.name}`}>
                      <Trash2 className="w-[12px] h-[12px]" />
                    </button>
                  )}
                </div>
              );
            })}
            {filtered.length > 10 && (
              <div className="px-5 py-4 text-center">
                <p className="text-[11px] font-[400] text-white/25">
                  {t("leaderboardComponent.moreParticipants", { count: filtered.length - 10 })}
                </p>
              </div>
            )}
          </>
        )}

        <div className="px-5 py-3 border-t border-white/[0.04] text-center">
          <p className="text-[10px] font-[400] text-white/20">{t("leaderboardComponent.footer")}</p>
        </div>
      </div>
    </>
  );
}

