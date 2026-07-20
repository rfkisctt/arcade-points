"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ExternalLink, Search, ChevronDown, X, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { COURSES, ALL_TAGS, ALL_MONTHS, CourseCategory, SkillLevel, Course } from "@/lib/courses";
import { useLang } from "@/components/Navbar";
import { useClientTranslation } from "@/lib/useClientTranslation";
import i18n from "@/lib/i18n";

const CATEGORIES: (CourseCategory | "All")[] = ["All", "Game", "Skill Badge"];
const SKILL_LEVELS: SkillLevel[] = ["Beginner", "Intermediate", "Advanced"];
const PAGE_SIZE = 20;

function FilterDropdown({ label, options, selected, onSelect, onClear, translationPrefix }: {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (v: string) => void;
  onClear: () => void;
  translationPrefix?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useClientTranslation();
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const has = selected.length > 0;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-[6px] h-[32px] px-3 rounded-[8px] text-[12px] font-[600] border transition-all duration-200 ${
          has
            ? "bg-[#FCAA26] border-[rgba(252,170,38,0.2)] text-[#0A0A0A]"
            : "bg-[#141414] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] hover:text-white hover:border-[rgba(255,255,255,0.2)]"
        }`}
      >
        {label}
        {has && <span className="text-[10px] font-[700] bg-[rgba(0,0,0,0.15)] rounded-full px-[5px] py-[1px]">{selected.length}</span>}
        <ChevronDown className={`w-[10px] h-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 bg-[#141414] border border-[rgba(255,255,255,0.1)] rounded-[8px] min-w-[160px] py-1">
          <div className="max-h-[240px] overflow-y-auto">
            {options.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => onSelect(opt)}
                  className={`w-full flex items-center justify-between px-3 py-[6px] text-[12px] font-[600] transition-colors duration-150 ${
                    active ? "text-[#FCAA26]" : "text-white/70 hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
                  }`}
                >
                  {translationPrefix ? t(`${translationPrefix}.${opt}`) : opt}
                  {active && <span className="w-[5px] h-[5px] rounded-full bg-[#FCAA26] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, isCompleted }: { course: Course; isCompleted: boolean }) {
  const [copied, setCopied] = useState(false);
  const { t } = useClientTranslation();

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!course.accessCode) return;
    navigator.clipboard.writeText(course.accessCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      title={t(course.titleKey)}
      className={`group relative border rounded-[10px] overflow-hidden flex flex-col transition-all duration-200 h-full ${
        isCompleted
          ? "bg-[#161616] border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.22)]"
          : "bg-[#161616] border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.032)]"
      }`}
    >
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] font-[600] text-[rgba(255,255,255,0.3)] uppercase tracking-wider">{t(`categories.${course.category}`)}</span>
            {course.month && <span className="text-[9px] text-[rgba(255,255,255,0.2)]">· {t(`months.${course.month}`)}</span>}
            {course.skillLevel && (
              <span className="text-[8px] font-[600] px-[5px] py-[0.5px] rounded-full border text-white/30 border-white/10">
                {t(`levels.${course.skillLevel}`)}
              </span>
            )}
          </div>
          {isCompleted ? (
            <span className="text-[8px] font-bold text-[#FCAA26] bg-[#FCAA26]/10 px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">✓ {t("courses.done")}</span>
          ) : (
            <ExternalLink className="w-[8px] h-[8px] text-white/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          )}
        </div>

        <h3 className="text-[11px] font-[600] text-white/90 leading-[16px] line-clamp-3 min-h-[48px]">{t(course.titleKey)}</h3>

        <div className={course.accessCode ? "visible" : "invisible pointer-events-none"}>
          <p className="text-[8px] font-[600] text-white/20 uppercase tracking-wider mb-1">{t("courses.accessCode")}</p>
          <div className="flex items-center gap-1">
            <code className="text-[10px] font-[700] text-white/40 tracking-wide break-all">
              {course.accessCode ?? "placeholder"}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 w-[16px] h-[16px] flex items-center justify-center rounded-[4px] text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-150"
              title={t("courses.copyCode")}
            >
              {copied ? (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1 gap-1">
          <div className="flex flex-wrap gap-1 min-w-0 overflow-hidden">
            {course.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[8px] font-[500] text-[rgba(255,255,255,0.22)] border border-[rgba(255,255,255,0.07)] px-[5px] py-[1px] rounded-full whitespace-nowrap"
              >
                {t(`courses.tags.${tag}`, tag)}
              </span>
            ))}
          </div>
          <span className="text-[10px] font-[700] shrink-0 text-white/30">
            {course.category === "Skill Badge" ? "½ pt" : "+1 pt"}
          </span>
        </div>
      </div>
    </a>
  );
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CourseCategory | "All">("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<SkillLevel[]>([]);
  const [completedTitles, setCompletedTitles] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const { lang } = useLang();
  const { t } = useClientTranslation();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("arcade_last_profile");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.badges) {
          setCompletedTitles(p.badges.map((b: { title: string }) => b.title.toLowerCase().trim()));
        }
      } catch {
      }
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, activeCategory, selectedTags, selectedMonths, selectedLevels]);

  const checkCompleted = (course: Course) => {
    // Always use EN title for matching — badge titles from Google profiles are always in English
    const enTitle = i18n.getFixedT("en")(course.titleKey).toLowerCase().trim();
    return completedTitles.some((b) => {
      if (b === enTitle) return true;
      const minLen = Math.min(b.length, enTitle.length);
      if (minLen >= 6 && (b.includes(enTitle) || enTitle.includes(b))) return true;
      const words = enTitle.split(/\s+/).filter(w => w.length > 3);
      if (words.length >= 2 && words.every(w => b.includes(w))) return true;
      return false;
    });
  };

  const filtered = useMemo(() => {
    return COURSES.filter((c) => {
      if (activeCategory !== "All" && c.category !== activeCategory) return false;
      if (search && !c.titleKey.toLowerCase().includes(search.toLowerCase()) && !c.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))) return false;
      if (selectedTags.length > 0 && !selectedTags.every((tag) => c.tags.includes(tag))) return false;
      if (selectedMonths.length > 0 && !(c.month && selectedMonths.includes(c.month))) return false;
      if (selectedLevels.length > 0 && !(c.skillLevel && selectedLevels.includes(c.skillLevel))) return false;
      return true;
    });
  }, [search, activeCategory, selectedTags, selectedMonths, selectedLevels, lang]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    All: COURSES.length,
    Game: COURSES.filter((c) => c.category === "Game").length,
    "Skill Badge": COURSES.filter((c) => c.category === "Skill Badge").length,
  };

  const hasFilter = !!(search || activeCategory !== "All" || selectedTags.length || selectedMonths.length || selectedLevels.length);
  const clearAll = () => {
    setSearch("");
    setActiveCategory("All");
    setSelectedTags([]);
    setSelectedMonths([]);
    setSelectedLevels([]);
  };

  const goToPage = (p: number) => {
    setPage(p);
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <div className="relative z-[1] pt-[72px]">
      <div className="divider" />
      <div className="page-container py-10">
        <h1
          className="text-[1.75rem] text-white mb-1 tracking-[-0.02em]"
          style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
        >
          {t("courses.title")}
        </h1>
        <p className="text-[13px] font-[400] text-white/40">{t("courses.subtitle")}</p>
      </div>
      <div className="divider" />

      <div className="page-container py-5">
        <div className="relative max-w-[360px] mb-4">
          <Search className="w-[12px] h-[12px] absolute left-[12px] top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.25)]" />
          <input
            type="text"
            placeholder={t("courses.searchPh")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-[32px] pr-4 h-[34px] bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[8px] text-[12px] font-[500] text-white focus:outline-none focus:border-[#FCAA26] transition-colors duration-200 placeholder:text-[rgba(255,255,255,0.2)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-[2px] gap-[1px]">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              const label = cat === "All" ? t("courses.catAll") : t(`categories.${cat}`);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-[5px] rounded-[6px] text-[11px] font-[600] transition-colors duration-150 ${
                    active ? "bg-white text-[#0A0A0A]" : "text-[rgba(255,255,255,0.4)] hover:text-white"
                  }`}
                >
                  <span suppressHydrationWarning>{label}</span> <span className={`text-[9px] ${active ? "text-[#0A0A0A]/50" : "text-[rgba(255,255,255,0.2)]"}`}>{counts[cat]}</span>
                </button>
              );
            })}
          </div>

          <FilterDropdown
            label={t("courses.topic")}
            options={ALL_TAGS}
            selected={selectedTags}
            onSelect={(tag) => setSelectedTags((p) => (p.includes(tag) ? p.filter((x) => x !== tag) : [...p, tag]))}
            onClear={() => setSelectedTags([])}
            translationPrefix="courses.tags"
          />

          <FilterDropdown
            label={t("courses.month")}
            options={ALL_MONTHS}
            selected={selectedMonths}
            onSelect={(m) => setSelectedMonths((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]))}
            onClear={() => setSelectedMonths([])}
            translationPrefix="months"
          />

          {(activeCategory === "Skill Badge" || activeCategory === "All") && (
            <FilterDropdown
              label={t("courses.level")}
              options={SKILL_LEVELS}
              selected={selectedLevels}
              onSelect={(l) => setSelectedLevels((p) => (p.includes(l as SkillLevel) ? p.filter((x) => x !== l) : [...p, l as SkillLevel]))}
              onClear={() => setSelectedLevels([])}
              translationPrefix="levels"
            />
          )}

          {hasFilter && (
            <button onClick={clearAll} className="flex items-center gap-1 text-[11px] font-[600] text-[rgba(255,255,255,0.3)] hover:text-white transition-colors px-2 py-[5px]">
              <X className="w-[10px] h-[10px]" /> {t("courses.reset")}
            </button>
          )}
        </div>

        <p className="text-[11px] font-[500] text-[rgba(255,255,255,0.25)] mt-4">
          {t("courses.counter", { filtered: filtered.length, total: COURSES.length })}
          {totalPages > 1 && <span className="ml-2 text-white/15">· {t("courses.page")} {page}/{totalPages}</span>}
        </p>
      </div>

      <div className="divider" />

      <div ref={gridRef} className="page-container py-6">
        {paginated.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {paginated.map((c) => (
                <CourseCard key={c.id} course={c} isCompleted={checkCompleted(c)} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-10">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="w-[32px] h-[32px] flex items-center justify-center rounded-[8px] border border-[rgba(255,255,255,0.1)] text-white/40 hover:text-white hover:border-white/25 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-[14px] h-[14px]" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isActive = p === page;
                  const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                  const showLeftDots = p === 2 && page > 4;
                  const showRightDots = p === totalPages - 1 && page < totalPages - 3;
                  if (!show) {
                    if (showLeftDots) return <span key={`ld-${p}`} className="text-white/20 text-[12px] w-[8px] text-center">…</span>;
                    if (showRightDots) return <span key={`rd-${p}`} className="text-white/20 text-[12px] w-[8px] text-center">…</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-[32px] h-[32px] flex items-center justify-center rounded-[8px] text-[12px] font-[600] transition-all ${
                        isActive ? "bg-white text-[#141414]" : "border border-[rgba(255,255,255,0.1)] text-white/40 hover:text-white hover:border-white/25"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="w-[32px] h-[32px] flex items-center justify-center rounded-[8px] border border-[rgba(255,255,255,0.1)] text-white/40 hover:text-white hover:border-white/25 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-[14px] h-[14px]" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-[48px] text-center">
            <p className="text-[13px] font-[500] text-[rgba(255,255,255,0.3)] mb-3">{t("courses.noResult")}</p>
            <button onClick={clearAll} className="text-[12px] font-[600] text-[#FCAA26] transition-colors">{t("courses.resetFilter")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
