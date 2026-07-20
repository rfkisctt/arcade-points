"use client";

import { Link2, FileCode2 } from "lucide-react";

interface InputMethodToggleProps {
  method: "link" | "manual";
  setMethod: (method: "link" | "manual") => void;
}

export function InputMethodToggle({ method, setMethod }: InputMethodToggleProps) {
  return (
    <div className="inline-flex items-center bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[3px] gap-[2px]">
      {(["link", "manual"] as const).map((m) => {
        const Icon = m === "link" ? Link2 : FileCode2;
        const label = m === "link" ? "Link" : "Manual";
        const active = method === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`flex items-center gap-[5px] px-3 py-[6px] rounded-[6px] text-[12px] font-[600] transition-colors duration-150 ${
              active ? "bg-white text-[#0c0c0c]" : "text-[rgba(255,255,255,0.5)] hover:text-white"
            }`}
          >
            <Icon className="w-[12px] h-[12px]" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
