"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, KeyboardEvent, useEffect, useRef, useMemo } from "react";
import { ArrowRight, ChevronRight, ArrowUp } from "lucide-react";
import { Dots } from "@/components/Dots";
import { useClientTranslation } from "@/lib/useClientTranslation";

function useTypewriter(phrases: string[]) {
  const [text, setText] = useState("");
  const phraseIdx = useRef(0);
  const charIdx = useRef(0);
  const deleting = useRef(false);
  const phrasesRef = useRef(phrases);

  useEffect(() => {
    phrasesRef.current = phrases;
    phraseIdx.current = 0;
    charIdx.current = 0;
    deleting.current = false;
    setText("");
  }, [phrases]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      const currentPhrases = phrasesRef.current;
      if (!currentPhrases.length) return;
      const phrase = currentPhrases[phraseIdx.current % currentPhrases.length];
      if (!deleting.current) {
        charIdx.current++;
        setText(phrase.slice(0, charIdx.current));
        if (charIdx.current === phrase.length) {
          deleting.current = true;
          timeout = setTimeout(tick, 2000);
          return;
        }
        timeout = setTimeout(tick, 38);
      } else {
        charIdx.current--;
        setText(phrase.slice(0, charIdx.current));
        if (charIdx.current === 0) {
          deleting.current = false;
          phraseIdx.current = (phraseIdx.current + 1) % currentPhrases.length;
          timeout = setTimeout(tick, 400);
          return;
        }
        timeout = setTimeout(tick, 18);
      }
    };
    timeout = setTimeout(tick, 600);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return text;
}

function HeroChatBox() {
  const [value, setValue] = useState("");
  const router = useRouter();
  const { t } = useClientTranslation();
  const phrasesRaw = t("home.phrases", { returnObjects: true });
  const phrases = useMemo(
    () => (Array.isArray(phrasesRaw) ? (phrasesRaw as string[]) : []),
    [JSON.stringify(phrasesRaw)]
  );
  const placeholder = useTypewriter(phrases);
  const hasValue = value.trim().length > 0;

  const handleSubmit = () => {
    const v = value.trim().toLowerCase();
    if (!v) return;
    if (v.includes("leaderboard") || v.includes("ranking")) {
      router.push("/leaderboard");
    } else if (v.includes("course") || v.includes("badge")) {
      router.push("/courses");
    } else {
      const isUrl = value.trim().startsWith("http") ||
        value.trim().includes("cloudskillsboost") ||
        value.trim().includes("skills.google");
      router.push(isUrl ? `/calculate?url=${encodeURIComponent(value.trim())}` : "/calculate");
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="w-full max-w-[620px] mx-auto">
      <div className="hero-chat-box">
        <div className="px-5 pt-5 pb-2">
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            aria-label="Search or enter profile URL"
            rows={3}
            className="w-full bg-transparent resize-none text-[16px] font-[400] text-white/90 placeholder:text-white/30 focus:outline-none leading-[26px]"
            style={{ fontFamily: "'seasonSans', sans-serif", height: "78px" }}
          />
        </div>
        <div className="px-4 pb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            aria-label="Submit"
            className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center transition-all duration-200 ${
              hasValue
                ? "bg-[#FCAA26] text-[#141414] hover:bg-[#FFBB3D] shadow-[0_0_10px_rgba(255,135,9,0.35)]"
                : "bg-white/[0.07] text-white/20 cursor-not-allowed"
            }`}
            disabled={!hasValue}
          >
            <ArrowUp className="w-[15px] h-[15px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useClientTranslation();

  const statsItems = ((): Array<{value: string; label: string; sub: string}> => {
    const raw = t("home.statsItems", { returnObjects: true });
    return Array.isArray(raw) ? (raw as Array<{value: string; label: string; sub: string}>) : [];
  })();

  const features = ((): Array<{href: string; title: string; desc: string; cta: string}> => {
    const raw = t("home.features", { returnObjects: true });
    return Array.isArray(raw) ? (raw as Array<{href: string; title: string; desc: string; cta: string}>) : [];
  })();

  const badgeTypes = ((): Array<{label: string; value: string; note: string}> => {
    const raw = t("home.badgeTypes", { returnObjects: true });
    return Array.isArray(raw) ? (raw as Array<{label: string; value: string; note: string}>) : [];
  })();

  const milestoneHeaders = ((): string[] => {
    const raw = t("home.milestoneHeaders", { returnObjects: true });
    return Array.isArray(raw) ? (raw as string[]) : [];
  })();

  return (
    <div className="relative z-[1] pt-[72px] overflow-x-hidden">

      <section className="page-container pt-24 pb-20 text-center flex flex-col items-center">
        <h1
          className="text-[clamp(3rem,6.5vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-white mb-5"
          style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
        >
          Arcade Points
        </h1>
        <p
          className="text-[16px] leading-[26px] text-white/55 max-w-[420px] mb-10"
          style={{ fontFamily: "'seasonSans', sans-serif", fontWeight: 400 }}
        >
          {t("home.heroDesc")}{" "}
          <a
            href="https://www.cloudskillsboost.google"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FCAA26] hover:opacity-80 transition-opacity underline underline-offset-2"
          >
            Google Cloud Skills Boost
          </a>{" →"}
        </p>
        <HeroChatBox />
      </section>

      <div className="divider" />

      <section className="page-container">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {statsItems.map(({ value, label, sub }, i) => (
            <div
              key={label}
              className={`px-6 py-7 ${i < 3 ? "border-r border-white/[0.07]" : ""} ${i < 2 ? "border-b md:border-b-0 border-white/[0.07]" : ""}`}
            >
              <p
                className="text-[2.4rem] text-[#FCAA26] leading-none mb-1 tracking-tight"
                style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
              >
                {value}
              </p>
              <p className="text-[13px] font-[600] text-white/90 mb-0.5">{label}</p>
              <p className="text-[11px] font-[400] text-white/50">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      <section className="page-container">
        <div className="px-6 pt-12 pb-5">
          <p className="text-[11px] font-[600] text-white/50 uppercase tracking-[0.16em]"
              style={{ fontFamily: "'seasonSans', sans-serif" }}>
            {t("home.featureLabel")}
          </p>
        </div>

        {features.map(({ href, title, desc, cta }, i, arr) => (
          <div key={href}>
            <Link
              href={href}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 hover:bg-white/[0.02] transition-colors duration-150"
            >
              <div className="flex-1 max-w-[600px]">
                <h2
                  className="text-[15px] text-white mb-1.5 group-hover:text-[#FCAA26] transition-colors duration-200"
                  style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
                >
                  {title}
                </h2>
                <p className="text-[13px] font-[400] text-white/55 leading-[21px]">{desc}</p>
              </div>
              <div className="flex items-center gap-1 text-[12px] font-[500] text-white/50 group-hover:text-[#FCAA26] transition-colors duration-200 shrink-0">
                {cta} <ChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </Link>
            {i < arr.length - 1 && <div className="divider" />}
          </div>
        ))}
      </section>

      <div id="sistem-poin" className="divider" />

      <section className="page-container px-6 py-14">
        <p className="text-[11px] font-[600] text-white/50 uppercase tracking-[0.16em] mb-6"
            style={{ fontFamily: "'seasonSans', sans-serif" }}>
          {t("home.systemPoin")}
        </p>
        <h2
          className="text-[2rem] text-white mb-1 tracking-[-0.02em]"
          style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
        >
          {t("home.programTitle")}
        </h2>
        <p className="text-[13px] font-[400] text-white/50 mb-10">{t("home.programDate")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 border border-white/[0.08] rounded-xl overflow-hidden mb-3">
          {badgeTypes.map(({ label, value, note }, i) => (
            <div
              key={label}
              className={`px-5 py-4 bg-[#161616] ${i < 2 ? "border-b sm:border-b-0 sm:border-r border-white/[0.07]" : ""}`}
            >
              <p
                className="text-[1.1rem] text-[#FCAA26] mb-0.5 tracking-tight"
                style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
              >
                {value}
              </p>
              <p className="text-[11px] font-[600] text-white">{label}</p>
              <p className="text-[10px] font-[400] text-white/50 mt-0.5">{note}</p>
            </div>
          ))}
        </div>

        <div className="border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_64px_90px_64px] px-4 py-2.5 bg-[#161616] border-b border-white/[0.06]">
            {milestoneHeaders.map((h, i) => (
              <span key={h} className={`text-[9px] font-[600] text-white/50 uppercase tracking-widest ${i > 0 ? "text-right" : ""}`}>{h}</span>
            ))}
          </div>
          {[
            { name: "Milestone 1", game: "6",  skill: "14", bonus: "+7" },
            { name: "Milestone 2", game: "8",  skill: "28", bonus: "+18" },
            { name: "Milestone 3", game: "10", skill: "42", bonus: "+29" },
            { name: "Ultimate",    game: "12", skill: "56", bonus: "+40" },
          ].map(({ name, game, skill, bonus }, i, arr) => (
            <div
              key={name}
              className={`grid grid-cols-[1fr_64px_90px_64px] px-4 py-3 bg-[#161616] items-center ${i < arr.length - 1 ? "border-b border-white/[0.06]" : ""}`}
            >
              <span className="text-[12px] font-[500] text-white">
                {t(`milestones.${name}`)}
              </span>
              <span className="text-[12px] font-[400] text-white/55 text-right">{game}</span>
              <span className="text-[12px] font-[400] text-white/55 text-right">{skill}</span>
              <span
                className="text-[12px] text-[#FCAA26] text-right"
                style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
              >
                {bonus}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      <section className="overflow-hidden relative" style={{ minHeight: "clamp(420px, 48vw, 580px)" }}>
        <div
          className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden"
          aria-hidden="true"
          style={{ opacity: 0.15 }}
        >
          <Dots
            style={{ width: "280%", height: "280%", display: "block", flexShrink: 0 }}
          />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-[1] px-6 text-center">
          <h2
            className="text-[2.2rem] text-white tracking-[-0.02em] mb-4 leading-[1.1]"
            style={{ fontFamily: "'seasonMix', sans-serif", fontWeight: 600 }}
          >
            {t("home.ctaTitle")}
          </h2>
          <p className="text-[14px] font-[400] text-white/55 mb-8 max-w-[360px] leading-[22px]">
            {t("home.ctaDesc")}
          </p>
          <Link
            href="/calculate"
            className="inline-flex items-center gap-2 h-[38px] px-6 bg-[#FCAA26] text-[#141414] rounded-lg text-[13px] font-[600] hover:bg-[#FFBB3D] transition-colors duration-200"
            style={{ fontFamily: "'seasonSans', sans-serif" }}
          >
            {t("home.ctaButton")} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

    </div>
  );
}
