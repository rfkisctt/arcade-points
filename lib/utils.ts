import { Badge, BadgeCategory, Profile, Stats } from "./types";
import { MILESTONES, POINT_RULES } from "./constants";

export function categorizeBadge(title: string): BadgeCategory {
  const t = title.toLowerCase();
  if (t.includes("trivia")) return "Trivia";
  if (t.includes("level") || t.includes("arcade") || t.includes("game") || t.includes("baseline") || t.includes("safe spaces")) return "Game";
  if (t.includes("ai boost bites") || t.includes("ai boost bootcamp")) return "Completion Badge";
  return "Skill Badge";
}

export function parseProfileHtml(html: string): Profile {
  if (typeof window === "undefined") throw new Error("parseProfileHtml hanya bisa dipanggil di browser.");

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  if (doc.title.toLowerCase().includes("page not found") || doc.body.textContent?.includes("The page you were looking for doesn't exist")) {
    throw new Error("Profil tidak ditemukan (404). Pastikan kodenya dari halaman yang benar.");
  }

  const textContent = doc.body.textContent?.toLowerCase() || "";
  if (textContent.includes("profile is private") || textContent.includes("profil ini disetel privat") || textContent.includes("make profile public")) {
    throw new Error("Profil disetel ke PRIVATE. Ubah ke PUBLIC di pengaturan Google Cloud Skills Boost.");
  }

  const nameElement = doc.querySelector("h1.ql-headline-1") || doc.querySelector("h1") || doc.querySelector(".profile-name");
  const avatarElement =
    doc.querySelector("ql-avatar img") || doc.querySelector(".avatar img") ||
    doc.querySelector('img[alt*="avatar" i]') || doc.querySelector('img[src*="googleusercontent"]') ||
    doc.querySelector('img[src*="lh3.google"]') || doc.querySelector('img[src*="photo"]') ||
    doc.querySelector(".profile-photo img") || doc.querySelector("[class*='avatar'] img") ||
    doc.querySelector("[class*='photo'] img");

  const profileName = nameElement ? nameElement.textContent?.trim() || "Explorer" : "Explorer";

  let avatarUrl = "";
  if (avatarElement) {
    const src = (avatarElement as HTMLImageElement).getAttribute("src") || (avatarElement as HTMLImageElement).src || "";
    if (src.startsWith("http")) avatarUrl = src;
    else if (src.startsWith("//")) avatarUrl = "https:" + src;
    else if (src.startsWith("/")) avatarUrl = "https://www.cloudskillsboost.google" + src;
  }
  if (!avatarUrl) {
    const m = html.match(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s]+/) || html.match(/https:\/\/[a-z0-9]+\.googleusercontent\.com\/[^"'\s]+/);
    if (m) avatarUrl = m[0];
  }

  let badgeElements = doc.querySelectorAll(".profile-badge, ql-badge, .badge-card, div[class*='badge']");
  if (badgeElements.length === 0) {
    badgeElements = doc.querySelectorAll("div > lwc-profile-badge, lwc-profile-badge, .profile-badges div");
  }

  const rawBadges: Badge[] = Array.from(badgeElements).map((badgeEl) => {
    const titleEl = badgeEl.querySelector(".ql-title-medium") || badgeEl.querySelector("span[class*='title']") || badgeEl.querySelector(".badge-title") || badgeEl.querySelector("h2") || badgeEl.querySelector("span");
    const dateEl = badgeEl.querySelector(".ql-body-medium") || badgeEl.querySelector("span[class*='date']") || badgeEl.querySelector(".badge-date") || badgeEl.querySelector("p");
    const imgEl = badgeEl.querySelector("img");
    const linkEl = badgeEl.closest("a[href*='badges']") || badgeEl.querySelector("a[href*='badges']");

    const title = titleEl ? titleEl.textContent?.trim() || "" : "";
    const dateEarned = dateEl ? dateEl.textContent?.trim() || "" : "";
    const imageUrl = imgEl ? (imgEl as HTMLImageElement).src : "";
    const badgeUrl = linkEl ? (linkEl as HTMLAnchorElement).href : undefined;

    return {
      title: title || "Unknown Badge",
      dateEarned: dateEarned || "Unknown Date",
      imageUrl,
      category: categorizeBadge(title || "Uncategorized"),
      badgeUrl,
    };
  }).filter((b) => b.title !== "Unknown Badge" || b.imageUrl !== "");

  const seen = new Set<string>();
  const badges = rawBadges.filter((b) => {
    const key = `${b.title}||${b.dateEarned}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (badges.length === 0 && !textContent.includes("badge")) {
    throw new Error('Tidak ada badge yang terdeteksi. Pastikan Anda menyalin seluruh "View Page Source".');
  }

  return { name: profileName, avatarUrl, badges };
}

export function calculateStats(profile: Profile, hasExtraBonus: boolean): Stats {
  const counts: Record<BadgeCategory, number> = { Game: 0, Trivia: 0, "Skill Badge": 0, "Completion Badge": 0, Uncategorized: 0 };
  profile.badges.forEach((b) => { counts[b.category] = (counts[b.category] || 0) + 1; });

  const basePoints =
    counts.Game * POINT_RULES.game +
    counts.Trivia * POINT_RULES.trivia +
    Math.floor(counts["Skill Badge"] / POINT_RULES.skillBadgePerPoint);

  let currentMilestone = MILESTONES[0];
  let nextMilestone = MILESTONES[1] || null;
  for (let i = 1; i < MILESTONES.length; i++) {
    if (counts.Game >= MILESTONES[i].reqGame && counts["Skill Badge"] >= MILESTONES[i].reqSkill) {
      currentMilestone = MILESTONES[i];
      nextMilestone = MILESTONES[i + 1] || null;
    }
  }

  const extraBonusPoint = hasExtraBonus && currentMilestone.bonus > 0 ? 10 : 0;
  const totalPoints = basePoints + currentMilestone.bonus + extraBonusPoint;

  let progressPercent = 100;
  let gamesToNext = 0;
  let skillsToNext = 0;

  if (nextMilestone) {
    gamesToNext = Math.max(0, nextMilestone.reqGame - counts.Game);
    skillsToNext = Math.max(0, nextMilestone.reqSkill - counts["Skill Badge"]);

    const gP = nextMilestone.reqGame > 0 ? Math.min(100, (counts.Game / nextMilestone.reqGame) * 100) : 100;
    const sP = nextMilestone.reqSkill > 0 ? Math.min(100, (counts["Skill Badge"] / nextMilestone.reqSkill) * 100) : 100;

    const totalReq = (nextMilestone.reqGame || 0) + (nextMilestone.reqSkill || 0);
    if (totalReq > 0) {
      progressPercent = Math.max(0, Math.min(100, gP * (nextMilestone.reqGame / totalReq) + sP * (nextMilestone.reqSkill / totalReq)));
    } else {
      progressPercent = Math.min(gP, sP);
    }
  }

  return { counts, basePoints, totalPoints, currentMilestone, nextMilestone, progressPercent, gamesToNext, skillsToNext, extraBonusPoint };
}
