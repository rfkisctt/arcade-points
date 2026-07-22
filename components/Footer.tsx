"use client";

import Link from "next/link";
import { useClientTranslation } from "@/lib/useClientTranslation";
import { useLang } from "./Navbar";

export function Footer() {
  const { t } = useClientTranslation();
  useLang();

  return (
    <footer className="w-full bg-[#141414] border-t border-dashed border-white/[0.06]" role="contentinfo">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 lg:px-6 pt-10 sm:pt-16 md:pt-20 pb-6 sm:pb-10 md:pb-12">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group shrink-0">
              <img src="/logo.png" alt="Arcade Points" className="w-[28px] h-[28px] object-contain" />
              <span className="text-[14px] font-bold text-white tracking-tight group-hover:text-[#FCAA26] transition-colors duration-200" style={{ lineHeight: "28px" }}>
                Arcade Points
              </span>
            </Link>
            <p className="text-[12px] font-medium text-white/50 leading-relaxed max-w-[200px]">
              {t("footer.desc")}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-4" aria-label="Navigation links">
            <h2 className="text-sm font-medium text-white">{t("footer.navTitle")}</h2>
            <div className="flex flex-col gap-3">
              <Link className="text-sm font-semibold text-white/55 hover:text-white transition-colors duration-200 min-h-[24px] flex items-center" href="/calculate">
                <span>{t("navbar.calculate")}</span>
              </Link>
              <Link className="text-sm font-semibold text-white/55 hover:text-white transition-colors duration-200 min-h-[24px] flex items-center" href="/leaderboard">
                {t("navbar.leaderboard")}
              </Link>
              <Link className="text-sm font-semibold text-white/55 hover:text-white transition-colors duration-200 min-h-[24px] flex items-center" href="/courses">
                <span>{t("footer.coursesLink")}</span>
              </Link>
            </div>
          </nav>

          {/* Official Resources */}
          <nav className="flex flex-col gap-4" aria-label="Resources links">
            <h2 className="text-sm font-medium text-white">{t("footer.resourcesTitle")}</h2>
            <div className="flex flex-col gap-3">
              <a target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-white/55 hover:text-white transition-colors duration-200 min-h-[24px] flex items-center" href="https://www.cloudskillsboost.google/">Skills Boost</a>
              <a target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-white/55 hover:text-white transition-colors duration-200 min-h-[24px] flex items-center" href="https://go.cloudskillsboost.google/arcade">Google Arcade</a>
              <a target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-white/55 hover:text-white transition-colors duration-200 min-h-[24px] flex items-center" href="https://www.skills.google/my_account/profile">{t("footer.myProfile")}</a>
            </div>
          </nav>

          {/* Community */}
          <nav className="flex flex-col gap-4" aria-label="Community links">
            <h2 className="text-sm font-medium text-white">{t("footer.communityTitle")}</h2>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-white/55 inline-flex items-center gap-2 cursor-not-allowed select-none">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" aria-hidden="true" height="14" width="14" xmlns="http://www.w3.org/2000/svg" className="opacity-60"><path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"></path></svg>
                <span>Discord</span>
                <span className="text-[9px] font-semibold text-white/55 bg-white/5 border border-[#141414] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  {t("footer.comingSoon")}
                </span>
              </span>
              <a target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-white/55 hover:text-white transition-colors duration-200 min-h-[24px] inline-flex items-center gap-2" href="https://github.com/rfkisctt/arcade-points">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </nav>
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-white/50">
              © {new Date().getFullYear()} Arcade Points
            </p>
            <div className="flex gap-3 justify-center md:justify-start text-[11px] font-semibold text-white/50">
              <Link href="/terms" className="hover:text-white transition-colors duration-200 min-h-[24px] flex items-center">
                {t("terms.title")}
              </Link>
              <span aria-hidden="true" className="text-white/20">·</span>
              <Link href="/privacy" className="hover:text-white transition-colors duration-200 min-h-[24px] flex items-center">
                {t("privacy.title")}
              </Link>
            </div>
          </div>
          <p className="text-[11px] font-medium text-white/50 max-w-[500px]">
            {t("footer.disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}
