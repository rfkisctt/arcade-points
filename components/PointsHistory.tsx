"use client";

import { Trash2, TrendingUp } from "lucide-react";
import { useClientTranslation } from "@/lib/useClientTranslation";
import { useLang } from "./Navbar";

export interface PointSnapshot {
  savedAt: number;
  totalPoints: number;
  basePoints: number;
  gameCount: number;
  skillCount: number;
  triviaCount: number;
  milestoneName: string;
}

const HISTORY_KEY = "arcade_points_history";
const MAX_SNAPSHOTS = 30;

export function savePointSnapshot(snapshot: PointSnapshot) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: PointSnapshot[] = raw ? JSON.parse(raw) : [];
    const last = history[history.length - 1];
    if (last && last.totalPoints === snapshot.totalPoints && last.gameCount === snapshot.gameCount && last.skillCount === snapshot.skillCount) return;
    history.push(snapshot);
    if (history.length > MAX_SNAPSHOTS) history.splice(0, history.length - MAX_SNAPSHOTS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function getPointHistory(): PointSnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw || raw.trim() === "" || raw.trim() === "undefined") return [];
    return JSON.parse(raw);
  } catch {
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
    return [];
  }
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 120, h = 32, pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1].split(",");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline
        points={pts.join(" ")}
        stroke="#FCAA26"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="#FCAA26" />
    </svg>
  );
}

interface PointsHistoryProps {
  currentPoints: number;
}

export function PointsHistory({ currentPoints }: PointsHistoryProps) {
  const history = getPointHistory();
  const { t } = useClientTranslation();
  const { lang } = useLang();

  if (history.length < 2) return null;

  const points = history.map(h => h.totalPoints);
  const first = history[0].totalPoints;
  const latest = history[history.length - 1].totalPoints;
  const delta = latest - first;

  const handleClear = () => {
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
    window.location.reload();
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-[#161616] border border-white/[0.08] rounded-[10px] overflow-hidden mt-4">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-[13px] h-[13px] text-[#FCAA26]" />
          <span className="text-[13px] font-[700] text-white">{t("pointsHistory.title")}</span>
          <span className="text-[10px] font-[600] text-white/30 bg-white/[0.05] border border-white/[0.07] px-[10px] py-[3px] rounded-full">
            {history.length} {t("pointsHistory.snapshots")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Sparkline data={points} />
          <span className={`text-[12px] font-[700] ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
            {delta >= 0 ? "+" : ""}{delta} {t("navbar.pointsUnit")}
          </span>
          <button
            onClick={handleClear}
            className="w-[28px] h-[28px] flex items-center justify-center rounded-[7px] text-white/20 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
            title={t("pointsHistory.clearHistory")}
          >
            <Trash2 className="w-[11px] h-[11px]" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]" style={{ fontFamily: "'seasonSans', sans-serif" }}>
          <thead>
            <tr className="border-b border-white/[0.04]">
              {[
                t("pointsHistory.colDate"),
                t("pointsHistory.colPoints"),
                t("pointsHistory.colDelta"),
                t("pointsHistory.colGame"),
                t("pointsHistory.colSkill"),
                t("pointsHistory.colMilestone")
              ].map(h => (
                <th key={h} className="px-4 py-2 text-left font-[600] text-white/25 uppercase tracking-wider text-[9px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().slice(0, 10).map((snap, i, arr) => {
              const prev = arr[i + 1];
              const d = prev ? snap.totalPoints - prev.totalPoints : null;
              return (
                <tr key={snap.savedAt} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-white/35">{formatDate(snap.savedAt)}</td>
                  <td className="px-4 py-2.5 font-[700] text-[#FCAA26]">{snap.totalPoints}</td>
                  <td className="px-4 py-2.5">
                    {d !== null ? (
                      <span className={`font-[600] ${d > 0 ? "text-green-400" : d < 0 ? "text-red-400" : "text-white/20"}`}>
                        {d > 0 ? "+" : ""}{d}
                      </span>
                    ) : <span className="text-white/15">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-white/40">{snap.gameCount}</td>
                  <td className="px-4 py-2.5 text-white/40">{snap.skillCount}</td>
                  <td className="px-4 py-2.5 text-white/35 whitespace-nowrap">{t(`milestones.${snap.milestoneName}`)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
