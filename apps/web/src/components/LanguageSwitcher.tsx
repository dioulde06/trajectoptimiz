"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

const LOCALES = [
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
  { code: "en", label: "EN" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="flex gap-1" aria-label="Sélecteur de langue">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLocale(code)}
          disabled={isPending}
          aria-current={locale === code ? "true" : undefined}
          className={`px-2 py-0.5 text-xs rounded font-medium transition-colors disabled:opacity-50 ${
            locale === code
              ? "bg-white text-saar-blue"
              : "text-blue-200 hover:text-white border border-blue-300 hover:border-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
