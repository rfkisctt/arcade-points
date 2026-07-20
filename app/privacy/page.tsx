"use client";

import Link from "next/link";
import { useClientTranslation } from "@/lib/useClientTranslation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const { t } = useClientTranslation();

  return (
    <div className="relative z-[1] pt-[112px] w-full max-w-3xl mx-auto px-4 sm:px-6 pb-12 md:pb-20">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white transition-colors duration-200 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>{t("privacy.back")}</span>
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">{t("privacy.title")}</h1>
      <p className="text-[12px] text-white/30 mb-8 uppercase tracking-wider font-semibold">{t("privacy.lastUpdated")}</p>

      <div className="space-y-6 text-sm text-white/60 leading-relaxed font-medium">
        <section>
          <h2 className="text-base font-bold text-white mb-2">{t("privacy.s1Title")}</h2>
          <p dangerouslySetInnerHTML={{ __html: t("privacy.s1Body") }} />
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2">{t("privacy.s2Title")}</h2>
          <p>{t("privacy.s2Body")}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2">{t("privacy.s3Title")}</h2>
          <p>{t("privacy.s3Body")}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2">{t("privacy.s4Title")}</h2>
          <p>{t("privacy.s4Body")}</p>
        </section>
      </div>
    </div>
  );
}
