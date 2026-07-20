"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, User, ExternalLink, Eye, EyeOff, LogOut, Settings, RefreshCw, Trophy, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, createContext, useContext } from "react";
import { saveToLeaderboard, ADMIN_SESSION_KEY } from "@/components/Leaderboard";

import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { useClientTranslation } from "@/lib/useClientTranslation";

export type Lang = "id" | "en";
export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; mounted: boolean }>({ lang: "en", setLang: () => {}, mounted: false });
export function useLang() { return useContext(LangContext); }

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
    const saved = localStorage.getItem("arcade_lang") as Lang | null;
    if (saved === "id" || saved === "en") {
      setLangState(saved);
      i18n.changeLanguage(saved);
    } else {
      localStorage.setItem("arcade_lang", "en");
      i18n.changeLanguage("en");
    }
    setMounted(true);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("arcade_lang", l);
    i18n.changeLanguage(l);
  };

  return <LangContext.Provider value={{ lang, setLang, mounted }}>{children}</LangContext.Provider>;
}

const GITHUB_REPO = "rfkisctt/arcade-points";

function useGithubStars(repo: string) {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    const cacheKey = `gh_stars_${repo}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setStars(Number(cached)); return; }
    fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then(r => r.json())
      .then(d => {
        if (typeof d.stargazers_count === "number") {
          setStars(d.stargazers_count);
          sessionStorage.setItem(cacheKey, String(d.stargazers_count));
        }
      })
      .catch(() => {});
  }, [repo]);
  return stars;
}



const SESSION_KEY = "arcade_current_user";
const VISIBILITY_KEY = "arcade_leaderboard_visible";

export interface CurrentUser {
  id?: string;
  name: string;
  avatarUrl: string;
  profileUrl?: string;
}

export function setCurrentUser(user: CurrentUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("arcade_user_updated"));
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    const load = () => {
      const raw = localStorage.getItem(SESSION_KEY);
      setUser(raw ? JSON.parse(raw) : null);
    };
    load();
    window.addEventListener("arcade_user_updated", load);
    return () => window.removeEventListener("arcade_user_updated", load);
  }, []);
  return user;
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireType?: string;
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel, requireType }: ConfirmModalProps) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");
  const canConfirm = requireType ? typed === requireType : true;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canConfirm) {
      e.preventDefault();
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[400px] bg-[#141414] border border-white/10 rounded-2xl p-6"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'seasonSans', sans-serif" }}
      >
        <p className="text-[15px] font-[700] text-white mb-2">{title}</p>
        <p className="text-[12px] font-[400] text-white/50 leading-relaxed mb-5">{message}</p>
        {requireType && (
          <div className="mb-5">
            <p className="text-[11px] font-[500] text-white/40 mb-2">
              {t("navbar.typeToConfirmPrefix")}{" "}<strong className="font-bold text-white not-italic">{requireType}</strong>{" "}{t("navbar.typeToConfirmSuffix")}
            </p>
            <input
              type="text"
              autoFocus
              value={typed}
              onChange={e => setTyped(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={requireType}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2.5 text-[13px] font-[500] text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="flex-1 h-[38px] bg-white/[0.07] text-white/70 text-[12px] font-[500] rounded-xl hover:bg-white/[0.12] transition-colors">
            {t("navbar.cancel")}
          </button>
          <button onClick={onConfirm} disabled={!canConfirm} className="flex-1 h-[38px] bg-red-500 text-white text-[12px] font-[600] rounded-xl hover:bg-red-400 transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountMenu({ user, onClose, onLogoutRequest }: { user: CurrentUser; onClose: () => void; onLogoutRequest: () => void }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(VISIBILITY_KEY);
    return v === null ? true : v === "true";
  });
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const toggleVisibility = async () => {
    const next = !visible;
    setVisible(next);
    localStorage.setItem(VISIBILITY_KEY, String(next));
    if (!user.id) return;
    try {
      const ownerToken = localStorage.getItem("arcade_owner_token") || "";
      if (!ownerToken) return;
      await fetch("/api/leaderboard/visibility", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-owner-token": ownerToken,
        },
        body: JSON.stringify({ id: user.id, hidden: !next }),
      });
      window.dispatchEvent(new CustomEvent("arcade_leaderboard_reload", {
        detail: { refetch: true },
      }));
    } catch {}
  };

  const handleSync = async () => {
    if (!user.profileUrl || syncing) return;
    setSyncing(true); setSyncMsg("");
    try {
      const lastStatsRaw = localStorage.getItem("arcade_last_stats");
      const hasExtraBonus = lastStatsRaw ? JSON.parse(lastStatsRaw).extraBonusPoint > 0 : false;
        const result = await saveToLeaderboard(user.profileUrl, hasExtraBonus);
      if (!result.ok) throw new Error(result.error || 'Sync failed');
      if (result.profile && result.stats) {
        localStorage.setItem("arcade_last_profile", JSON.stringify(result.profile));
        localStorage.setItem("arcade_last_stats", JSON.stringify(result.stats));
        setCurrentUser({ id: user.profileUrl, name: result.profile.name, avatarUrl: result.profile.avatarUrl, profileUrl: user.profileUrl });
      }
      sessionStorage.setItem("arcade_last_sync", Date.now().toString());
      setSyncMsg(t("navbar.syncSuccess"));
    } catch { setSyncMsg(t("navbar.syncFailed")); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(""), 3000); }
  };

  const lastStats = typeof window !== "undefined" ? localStorage.getItem("arcade_last_stats") : null;
  const stats = lastStats ? (() => { try { return JSON.parse(lastStats); } catch { return null; } })() : null;

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-[260px] bg-[#141414] border border-white/[0.1] rounded-xl overflow-hidden z-50" style={{ fontFamily: "'seasonSans', sans-serif" }} onClick={e => e.stopPropagation()}>
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <img src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" className="w-[40px] h-[40px] rounded-full object-cover border border-white/10 shrink-0" onError={e => { const initials = user.name.split(" ").map((w: string) => w[0] || "").join("").slice(0,2).toUpperCase(); (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1a1a1a&color=fcaa26&size=80&bold=true&format=svg`; }} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-[600] text-white truncate">{user.name}</p>
            {stats && <p className="text-[11px] font-[400] text-[#FCAA26] mt-0.5">{stats.totalPoints} {t("navbar.pointsUnit")} · {t(`milestones.${stats.currentMilestone?.name}`)}</p>}
          </div>
        </div>
        {stats && (
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {[{ label: t("navbar.gameLabel"), val: stats.counts?.Game ?? 0 }, { label: t("navbar.skillLabel"), val: stats.counts?.["Skill Badge"] ?? 0 }].map(({ label, val }) => (
              <div key={label} className="bg-[#161616] border border-white/[0.06] rounded-lg px-2 py-1.5 text-center">
                <p className="text-[13px] font-[600] text-white leading-none">{val}</p>
                <p className="text-[9px] font-[400] text-white/35 mt-0.5 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="py-1.5">
        {user.profileUrl && <a href={user.profileUrl} target="_blank" rel="noopener noreferrer" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-[400] text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"><ExternalLink className="w-[13px] h-[13px] shrink-0 text-white/40" />{t("navbar.viewSkillsBoost")}</a>}
        <Link href="/calculate" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-[400] text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"><Trophy className="w-[13px] h-[13px] shrink-0 text-white/40" />{t("navbar.viewCalculator")}</Link>
        <div className="mx-4 my-1.5 border-t border-white/[0.06]" />
        <button onClick={toggleVisibility} className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-[12px] font-[400] hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-3">
            {visible ? <Eye className="w-[13px] h-[13px] text-white/40 shrink-0" /> : <EyeOff className="w-[13px] h-[13px] text-white/40 shrink-0" />}
            <span className={visible ? "text-white/70" : "text-white/40"}>{visible ? t("navbar.showOnLeaderboard") : t("navbar.hidden")}</span>
          </div>
          <div className={`w-[32px] h-[18px] rounded-full transition-colors duration-200 relative shrink-0 ${visible ? "bg-[#FCAA26]" : "bg-white/10"}`}>
            <div className={`absolute top-[3px] w-[12px] h-[12px] rounded-full bg-white shadow transition-all duration-200 ${visible ? "left-[17px]" : "left-[3px]"}`} />
          </div>
        </button>
        {user.profileUrl && <button onClick={handleSync} disabled={syncing} className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-[400] text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50"><RefreshCw className={`w-[13px] h-[13px] text-white/40 shrink-0 ${syncing ? "animate-spin" : ""}`} />{syncMsg || (syncing ? t("navbar.syncing") : t("navbar.syncNow"))}</button>}
        <Link href="/calculate" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-[400] text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"><Settings className="w-[13px] h-[13px] shrink-0 text-white/40" />{t("navbar.updateProfile")}</Link>
        <div className="mx-4 my-1.5 border-t border-white/[0.06]" />
        <button onClick={onLogoutRequest} className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-[400] text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.05] transition-colors"><LogOut className="w-[13px] h-[13px] shrink-0" />{t("navbar.keluar")}</button>
      </div>
    </div>
  );
}

function SignInPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isUrl = (s: string) => s.startsWith("http://") || s.startsWith("https://");

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true); setError("");

    if (!isUrl(trimmed)) {
      try {
        const res = await fetch("/api/leaderboard/by-slug/__verify__", {
          method: "DELETE",
          headers: { "x-admin-secret": trimmed },
        });
        if (res.status === 401) {
          setError(t("navbar.invalidUrl"));
          setLoading(false);
          return;
        }
        sessionStorage.setItem(ADMIN_SESSION_KEY, trimmed);
        window.dispatchEvent(new CustomEvent("arcade_admin_login"));
        onClose();
        setLoading(false);
        return;
      } catch {
        setError(t("navbar.networkError"));
        setLoading(false);
        return;
      }
    }

    try {
      const result = await saveToLeaderboard(trimmed, false);
      if (!result.ok) throw new Error(result.error || t("navbar.fetchProfileError"));
      if (result.profile && result.stats) {
        localStorage.setItem("arcade_last_profile", JSON.stringify(result.profile));
        localStorage.setItem("arcade_last_stats", JSON.stringify(result.stats));
        localStorage.setItem("arcade_last_profile_url", trimmed);
        setCurrentUser({ id: trimmed, name: result.profile.name, avatarUrl: result.profile.avatarUrl, profileUrl: trimmed });
      }
      onClose();
      router.push("/calculate");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("navbar.generalError"));
    } finally { setLoading(false); }
  };

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-[300px] bg-[#141414] border border-white/[0.1] rounded-xl z-50 p-4" style={{ fontFamily: "'seasonSans', sans-serif" }} onClick={e => e.stopPropagation()}>
      <p className="text-[13px] font-[600] text-white mb-1">{t("navbar.masukDenganProfil")}</p>
      <p className="text-[11px] font-[400] text-white/40 mb-4 leading-relaxed">{t("navbar.tempelLinkProfil")} <a href="https://www.skills.google/my_account/profile" target="_blank" rel="noopener noreferrer" className="text-[#FCAA26] hover:opacity-80">Skills Boost</a></p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          autoFocus
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.cloudskillsboost.google/public_profiles/..."
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-[12px] font-[400] text-white placeholder:text-white/25 focus:outline-none focus:border-[#FCAA26] transition-colors"
          disabled={loading}
        />
        {error && <p className="text-[11px] text-red-400 font-[400]">{error}</p>}
        <button type="submit" disabled={loading || !url.trim()} className="w-full h-[34px] bg-[#FCAA26] text-[#141414] rounded-lg text-[12px] font-[600] hover:bg-[#FFBB3D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          {loading ? <><span className="w-3 h-3 border-2 border-[#141414]/30 border-t-[#141414] rounded-full animate-spin" />{t("navbar.loading")}</> : t("navbar.signInCalculate")}
        </button>
      </form>
    </div>
  );
}

function AdminMenu({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-[#141414] border border-white/[0.1] rounded-xl overflow-hidden z-50" style={{ fontFamily: "'seasonSans', sans-serif" }} onClick={e => e.stopPropagation()}>
      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
        <div className="w-[32px] h-[32px] rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-[14px] h-[14px] text-red-400" />
        </div>
        <div>
          <p className="text-[12px] font-[700] text-white">{t("navbar.adminLabel")}</p>
          <p className="text-[10px] font-[400] text-red-400/70">{t("navbar.adminModeActive")}</p>
        </div>
      </div>
      <div className="py-1">
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-[400] text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.05] transition-colors"
        >
          <LogOut className="w-[13px] h-[13px] shrink-0" />{t("navbar.exitAdminMode")}
        </button>
      </div>
    </div>
  );
}

import React from "react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const [avatarError, setAvatarError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [logoutModal, setLogoutModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const { lang, setLang: handleSetLang } = useLang();
  const stars = useGithubStars(GITHUB_REPO);

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY)) setIsAdmin(true);
    const onLogin = () => setIsAdmin(true);
    const onLogout = () => setIsAdmin(false);
    window.addEventListener("arcade_admin_login", onLogin);
    window.addEventListener("arcade_admin_logout", onLogout);
    return () => {
      window.removeEventListener("arcade_admin_login", onLogin);
      window.removeEventListener("arcade_admin_logout", onLogout);
    };
  }, []);

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdmin(false);
    window.dispatchEvent(new Event("arcade_admin_logout"));
  };

  const { t } = useClientTranslation();

  const navItems = [
    { href: "/calculate", label: t("navbar.calculate") },
    { href: "/leaderboard", label: t("navbar.leaderboard") },
    { href: "/courses", label: t("navbar.courses") },
  ];

  useEffect(() => { setAvatarError(false); }, [user?.avatarUrl]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!user?.profileUrl) return;
    const lastSync = sessionStorage.getItem("arcade_last_sync");
    const now = Date.now();
    if (lastSync && now - parseInt(lastSync) < 30 * 60 * 1000) return;
    const syncProfile = async () => {
      try {
        const lastStatsRaw = localStorage.getItem("arcade_last_stats");
        const hasExtraBonus = lastStatsRaw ? JSON.parse(lastStatsRaw).extraBonusPoint > 0 : false;
          const result = await saveToLeaderboard(user.profileUrl!, hasExtraBonus);
        if (result.ok && result.profile && result.stats) {
          const serverStats = result.stats as Record<string, unknown>;
          localStorage.setItem("arcade_last_profile", JSON.stringify(result.profile));
          localStorage.setItem("arcade_last_stats", JSON.stringify(result.stats));
          setCurrentUser({ id: user.profileUrl!, name: result.profile.name, avatarUrl: result.profile.avatarUrl, profileUrl: user.profileUrl });
          window.dispatchEvent(new CustomEvent("arcade_user_updated", { detail: serverStats }));
        }
        sessionStorage.setItem("arcade_last_sync", Date.now().toString());
      } catch (e) { console.error("Background sync failed", e); }
    };
    const t = setTimeout(syncProfile, 1500);
    return () => clearTimeout(t);
  }, [user]);

  const handleLogoutConfirm = async () => {
    const id = user?.id;
    const ownerToken = localStorage.getItem("arcade_owner_token") || "";
    const mySlug = localStorage.getItem("arcade_my_slug") || "";
    const myName = user?.name || "";

    if (id) {
      try {
        if (ownerToken) {
          await fetch(`/api/leaderboard?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: { "x-owner-token": ownerToken },
          });
        } else {
            await fetch("/api/leaderboard/visibility", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, hidden: true }),
          });
        }
      } catch (e) {
        console.error("Failed to delete leaderboard entry on logout", e);
      }
    }

    [SESSION_KEY, "arcade_last_profile", "arcade_last_stats", "arcade_last_profile_url", "arcade_last_extra_bonus", VISIBILITY_KEY, "arcade_my_slug", "arcade_owner_token", "arcade_leaderboard_cache"].forEach(k => localStorage.removeItem(k));

    window.dispatchEvent(new Event("arcade_user_updated"));
    window.dispatchEvent(new CustomEvent("arcade_leaderboard_reload", {
      detail: { slug: mySlug, name: myName, refetch: true },
    }));
    setLogoutModal(false);
    setMenuOpen(false);
    router.push("/");
  };

  useEffect(() => {
    const handleRemovedByAdmin = () => {
      [SESSION_KEY, "arcade_last_profile", "arcade_last_stats", "arcade_last_profile_url",
        "arcade_last_extra_bonus", VISIBILITY_KEY, "arcade_my_slug", "arcade_owner_token",
        "arcade_leaderboard_cache"].forEach(k => localStorage.removeItem(k));
      window.dispatchEvent(new Event("arcade_user_updated"));
      setMenuOpen(false);
      router.push("/");
    };
    window.addEventListener("arcade_user_removed_by_admin", handleRemovedByAdmin);
    return () => window.removeEventListener("arcade_user_removed_by_admin", handleRemovedByAdmin);
  }, [router]);

  return (
    <>
      {logoutModal && (
        <ConfirmModal
          title={t("navbar.confirmLogoutTitle")}
          message={t("navbar.confirmLogoutMsg")}
          confirmLabel={t("navbar.confirmLogoutYes")}
          requireType={t("navbar.confirmLogoutRequireText")}
          onConfirm={handleLogoutConfirm}
          onCancel={() => setLogoutModal(false)}
        />
      )}

      <header className="fixed top-0 left-0 right-0 z-20 bg-[#141414]">
        <div className="w-full bg-[#141414] border-b border-dashed border-white/[0.06]">
          <div className="max-w-[1200px] mx-auto px-6 py-[9px] flex items-center justify-center">
            <a href="https://go.cloudskillsboost.google/arcade" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-[12px] text-[#FCAA26] hover:text-[#FFBB3D] transition-colors duration-200" style={{ fontFamily: "'seasonSans', sans-serif", fontWeight: 500 }}>
              <span>{t("navbar.arcade2026")}</span>
              <ArrowRight className="w-[10px] h-[10px] transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="w-full bg-[#141414] border-b border-dashed border-white/[0.06]">
          <div className="max-w-[1200px] mx-auto px-6">
            <nav className="flex items-center justify-between h-[52px]">
              <Link href="/" className="flex items-center gap-2 shrink-0 group">
                <img src="/logo.png" alt="Arcade Points" className="w-[28px] h-[28px] object-contain" />
                <span className="text-[14px] text-white tracking-tight group-hover:text-[#FCAA26] transition-colors duration-200" style={{ fontFamily: "'seasonSans', sans-serif", fontWeight: 600, lineHeight: "28px" }}>Arcade Points</span>
              </Link>

              <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
                {navItems.map(({ href, label }) => {
                  const isActive = pathname === href;
                  return (
                    <Link key={href} href={href} className={`text-[13px] transition-colors duration-200 ${isActive ? "text-white font-[600]" : "text-white/45 hover:text-white/75 font-[400]"}`} style={{ fontFamily: "'seasonSans', sans-serif" }}>
                      {label}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://saweria.co/rfkisctt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 h-[32px] rounded-lg border border-white/[0.13] bg-transparent text-[12px] font-[400] text-white/60 hover:text-white hover:border-white/25 transition-all duration-200"
                  style={{ fontFamily: "'seasonSans', sans-serif" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {t("navbar.support")}
                </a>

                <a
                  href={`https://github.com/${GITHUB_REPO}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 h-[32px] px-2.5 rounded-lg border border-white/[0.13] bg-transparent text-white/60 hover:text-white hover:border-white/25 transition-all duration-200"
                  title="GitHub"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  {stars !== null && stars !== undefined && (
                    <span className="text-[11px] font-[600]">
                      {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars)}
                    </span>
                  )}
                </a>

                <button
                  onClick={() => handleSetLang(lang === "id" ? "en" : "id")}
                  className="flex items-center h-[32px] px-2.5 rounded-lg border border-white/[0.13] bg-transparent text-[11px] font-[600] text-white/60 hover:text-white hover:border-white/25 transition-all duration-200 gap-1.5"
                  style={{ fontFamily: "'seasonSans', sans-serif" }}
                  title="Toggle language"
                >
                  <span className={lang === "id" ? "text-white" : "text-white/30"}>ID</span>
                  <span className="text-white/20">/</span>
                  <span className={lang === "en" ? "text-white" : "text-white/30"}>EN</span>
                </button>

                {user ? (
                  <div ref={menuRef} className="relative">
                    <button onClick={() => setMenuOpen(o => !o)} className={`flex items-center gap-2 px-3 h-[32px] rounded-lg border text-[12px] font-[500] transition-all duration-200 ${menuOpen ? "bg-white/[0.08] border-white/[0.2] text-white" : "bg-transparent border-white/[0.13] text-white hover:text-white hover:border-white/25"}`} style={{ fontFamily: "'seasonSans', sans-serif" }}>
                      {user.avatarUrl && !avatarError ? (
                        <img src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" className="w-[20px] h-[20px] rounded-full object-cover border border-white/10 shrink-0" onError={() => setAvatarError(true)} />
                      ) : (
                        <div className="w-[20px] h-[20px] rounded-full bg-[#FCAA26]/20 flex items-center justify-center shrink-0"><User className="w-[10px] h-[10px] text-[#FCAA26]" /></div>
                      )}                      <span className="truncate max-w-[90px]">{user.name.split(" ")[0]}</span>
                      <ChevronRight className={`w-3 h-3 text-white/40 transition-transform duration-200 shrink-0 ${menuOpen ? "rotate-90" : ""}`} />
                    </button>
                    {menuOpen && <AccountMenu user={user} onClose={() => setMenuOpen(false)} onLogoutRequest={() => { setMenuOpen(false); setLogoutModal(true); }} />}
                  </div>
                ) : isAdmin ? (
                  <div ref={menuRef} className="relative">
                    <button onClick={() => setMenuOpen(o => !o)} className={`flex items-center gap-2 px-3 h-[32px] rounded-lg border text-[12px] font-[500] transition-all duration-200 ${menuOpen ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-500/[0.06] border-red-500/20 text-red-400 hover:bg-red-500/10"}`} style={{ fontFamily: "'seasonSans', sans-serif" }}>
                      <ShieldCheck className="w-[13px] h-[13px] shrink-0" />
                      <span>{t("navbar.adminLabel")}</span>
                      <ChevronRight className={`w-3 h-3 text-red-400/50 transition-transform duration-200 shrink-0 ${menuOpen ? "rotate-90" : ""}`} />
                    </button>
                    {menuOpen && <AdminMenu onClose={() => setMenuOpen(false)} onLogout={handleAdminLogout} />}
                  </div>
                ) : (
                  <div ref={menuRef} className="relative">
                    <button onClick={() => setMenuOpen(o => !o)} className={`flex items-center gap-2 px-3 h-[32px] rounded-lg border text-[12px] transition-all duration-200 ${menuOpen ? "bg-white/[0.08] border-white/[0.2] text-white font-[500]" : "bg-transparent border-white/[0.13] text-white/60 font-[400] hover:text-white hover:border-white/25"}`} style={{ fontFamily: "'seasonSans', sans-serif" }}>
                      {t("navbar.signIn")}
                    </button>
                    {menuOpen && <SignInPanel onClose={() => setMenuOpen(false)} />}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
