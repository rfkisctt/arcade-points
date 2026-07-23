"use client";

/**
 * useClientTranslation
 *
 * Drop-in replacement for useTranslation() that prevents hydration mismatches.
 *
 * Problem: SSR always renders in "en" (no localStorage access), but the client
 * may have "id" saved. React then throws a hydration mismatch because the text
 * content differs between server and client.
 *
 * Solution: On the first render (before hydration is confirmed), return the
 * "en" translation so it matches SSR. After mount, switch to the real locale.
 * This is invisible to the user because it happens before paint.
 */

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import i18n from "@/lib/i18n";

export function useClientTranslation() {
  const [mounted, setMounted] = useState(false);
  const { t, i18n: instance } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    const enT = (key: string, options?: Record<string, unknown>) => {
      const enResources = i18n.getResourceBundle("en", "translation");
      if (!enResources) return t(key, options);
      const keys = key.split(".");
      let val: any = enResources;
      for (const k of keys) {
        if (val && typeof val === "object") val = val[k];
        else { val = undefined; break; }
      }
      if (typeof val === "string") {
        if (options) {
          return val.replace(/\{\{(\w+)\}\}/g, (_, k) =>
            options[k] !== undefined ? String(options[k]) : `{{${k}}}`
          );
        }
        return val;
      }
      if (options?.returnObjects) return val ?? key;
      return key;
    };
    return { t: enT as typeof t, i18n: instance, mounted: false };
  }

  return { t, i18n: instance, mounted: true };
}
