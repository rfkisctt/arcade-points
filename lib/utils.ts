import { Badge, BadgeCategory, Profile, Stats } from "./types";
import { MILESTONES, POINT_RULES } from "./constants";

export function categorizeBadge(title: string): BadgeCategory {
  const t = title.toLowerCase();
  if (t.includes("trivia")) return "Trivia";
  if (t.includes("level") || t.includes("arcade") || t.includes("game") || t.includes("baseline") || t.includes("challenge") || t.includes("safe spaces")) return "Game";
  if (t.includes("course") || t.includes("path") || t.includes("completion badge") || t.includes("ai boost bites")) return "Completion Badge";
  return "Skill Badge";
}

export function parseProfileHtml(html: string): Profile {
  if (typeof window === "undefined") {
    throw new Error("parseProfileHtml hanya bisa dipanggil di browser.");
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  if (doc.title.toLowerCase().includes("page not found") || doc.body.textContent?.includes("The page you were looking for doesn't exist")) {
    throw new Error("Profil tidak ditemukan (404). Pastikan kodenya dari halaman yang benar.");
  }

  const textContent = doc.body.textContent?.toLowerCase() || "";
  const isPrivate = textContent.includes("profile is private") ||
    textContent.includes("profil ini disetel privat") ||
    textContent.includes("make profile public");
  if (isPrivate) {
    throw new Error("Profil disetel ke PRIVATE. Ubah ke PUBLIC di pengaturan Google Cloud Skills Boost.");
  }

  const nameElement = doc.querySelector("h1.ql-headline-1") || doc.querySelector("h1") || doc.querySelector(".profile-name");

  const avatarElement =
    doc.querySelector("ql-avatar img") ||
    doc.querySelector(".avatar img") ||
    doc.querySelector('img[alt*="avatar" i]') ||
    doc.querySelector('img[src*="googleusercontent"]') ||
    doc.querySelector('img[src*="lh3.google"]') ||
    doc.querySelector('img[src*="photo"]') ||
    doc.querySelector(".profile-photo img") ||
    doc.querySelector("[class*='avatar'] img") ||
    doc.querySelector("[class*='photo'] img");

  const profileName = nameElement ? nameElement.textContent?.trim() || "Explorer" : "Explorer";

  let avatarUrl = "";
  if (avatarElement) {
    const src = (avatarElement as HTMLImageElement).getAttribute("src") || (avatarElement as HTMLImageElement).src || "";
    // Make absolute if relative
    if (src.startsWith("http")) {
      avatarUrl = src;
    } else if (src.startsWith("//")) {
      avatarUrl = "https:" + src;
    } else if (src.startsWith("/")) {
      avatarUrl = "https://www.cloudskillsboost.google" + src;
    }
  }
  if (!avatarUrl) {
    const googleImgMatch = html.match(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s]+/);
    if (googleImgMatch) avatarUrl = googleImgMatch[0];
  }
  if (!avatarUrl) {
    const googleImgMatch2 = html.match(/https:\/\/[a-z0-9]+\.googleusercontent\.com\/[^"'\s]+/);
    if (googleImgMatch2) avatarUrl = googleImgMatch2[0];
  }

  let badgeElements = doc.querySelectorAll(".profile-badge, ql-badge, .badge-card, div[class*='badge']");
  if (badgeElements.length === 0) {
    badgeElements = doc.querySelectorAll("div > lwc-profile-badge, lwc-profile-badge, .profile-badges div");
  }

  const badges: Badge[] = Array.from(badgeElements).map((badgeEl) => {
    const titleEl = badgeEl.querySelector(".ql-title-medium") || badgeEl.querySelector("span[class*='title']") || badgeEl.querySelector(".badge-title") || badgeEl.querySelector("h2") || badgeEl.querySelector("span");
    const dateEl = badgeEl.querySelector(".ql-body-medium") || badgeEl.querySelector("span[class*='date']") || badgeEl.querySelector(".badge-date") || badgeEl.querySelector("p");
    const imgEl = badgeEl.querySelector("img");
    const linkEl = badgeEl.closest("a[href*='badges']") || badgeEl.querySelector("a[href*='badges']");
    const badgeUrl = linkEl ? (linkEl as HTMLAnchorElement).href : undefined;

    const title = titleEl ? titleEl.textContent?.trim() || "" : "";
    const dateEarned = dateEl ? dateEl.textContent?.trim() || "" : "";
    const imageUrl = imgEl ? (imgEl as HTMLImageElement).src : "";
    const badgeText = badgeEl.textContent?.toLowerCase() || "";

    return {
      title: title || "Unknown Badge",
      dateEarned: dateEarned || "Unknown Date",
      imageUrl,
      category: badgeText.includes("completion badge") || badgeText.includes("ai boost bites") ? "Completion Badge" : categorizeBadge(title || "Uncategorized"),
      badgeUrl,
    };
  }).filter((b) => b.title !== "Unknown Badge" || b.imageUrl !== "");

  if (badges.length === 0 && !textContent.includes("badge")) {
    throw new Error("Tidak ada badge yang terdeteksi. Pastikan Anda menyalin seluruh \"View Page Source\".");
  }

  return { name: profileName, avatarUrl, badges };
}

export function calculateStats(profile: Profile, hasExtraBonus: boolean): Stats {
  const counts: Record<BadgeCategory, number> = { Game: 0, Trivia: 0, "Skill Badge": 0, "Completion Badge": 0, Uncategorized: 0 };
  profile.badges.forEach((b) => {
    counts[b.category] = (counts[b.category] || 0) + 1;
  });

  // Completion Badge TIDAK dihitung sebagai Skill Badge
  const pointsFromGames = counts.Game * POINT_RULES.game;
  const pointsFromTrivia = counts.Trivia * POINT_RULES.trivia;
  const pointsFromSkills = Math.floor(counts["Skill Badge"] / POINT_RULES.skillBadgePerPoint);

  const basePoints = pointsFromGames + pointsFromTrivia + pointsFromSkills;

  let currentMilestone = MILESTONES[0];
  let nextMilestone = MILESTONES[1] || null;

  for (let i = 1; i < MILESTONES.length; i++) {
    if (counts.Game >= MILESTONES[i].reqGame && counts["Skill Badge"] >= MILESTONES[i].reqSkill) {
      currentMilestone = MILESTONES[i];
      nextMilestone = MILESTONES[i + 1] || null;
    }
  }

  const extraBonusPoint = (hasExtraBonus && currentMilestone.bonus > 0) ? 10 : 0;
  const totalPoints = basePoints + currentMilestone.bonus + extraBonusPoint;

  let progressPercent = 100;
  let gamesToNext = 0;
  let skillsToNext = 0;

  if (nextMilestone) {
    const gameProgress = nextMilestone.reqGame > 0
      ? Math.min(100, (counts.Game / nextMilestone.reqGame) * 100)
      : 100;
    const skillProgress = nextMilestone.reqSkill > 0
      ? Math.min(100, (counts["Skill Badge"] / nextMilestone.reqSkill) * 100)
      : 100;
    progressPercent = Math.max(0, Math.min(100, Math.min(gameProgress, skillProgress)));
    gamesToNext = Math.max(0, nextMilestone.reqGame - counts.Game);
    skillsToNext = Math.max(0, nextMilestone.reqSkill - counts["Skill Badge"]);
  }

  return {
    counts,
    basePoints,
    totalPoints,
    currentMilestone,
    nextMilestone,
    progressPercent,
    gamesToNext,
    skillsToNext,
    extraBonusPoint,
  };
}
