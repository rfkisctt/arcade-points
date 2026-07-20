"use client";

import { Monitor, Smartphone } from "lucide-react";

interface DeviceToggleProps {
  deviceMode: "desktop" | "mobile";
  setDeviceMode: (mode: "desktop" | "mobile") => void;
}

export function DeviceToggle({ deviceMode, setDeviceMode }: DeviceToggleProps) {
  return (
    <div className="inline-flex items-center bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[3px] gap-[2px]">
      {(["desktop", "mobile"] as const).map((m) => {
        const Icon = m === "desktop" ? Monitor : Smartphone;
        const label = m === "desktop" ? "Desktop" : "Mobile";
        const active = deviceMode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setDeviceMode(m)}
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
