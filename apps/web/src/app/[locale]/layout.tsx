import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { TRPCProvider } from "@/trpc/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
// @ts-ignore: side-effect CSS import
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
    keywords: ["transport", "Saarbrücken", "S-Bahn", "Saarland"],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const tHeader = await getTranslations({ locale, namespace: "header" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <TRPCProvider>
            <header className="bg-saar-blue text-white shadow-md">
              <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="16" cy="16" r="15" fill="#F0A500" />
                    <path
                      d="M8 16 L16 8 L24 16 L16 24 Z"
                      fill="white"
                      opacity="0.9"
                    />
                    <circle cx="16" cy="16" r="4" fill="#003B6F" />
                  </svg>
                  <div>
                    <h1 className="text-xl font-bold leading-tight">
                      trajectoptimiz
                    </h1>
                    <p className="text-blue-200 text-xs">
                      {tHeader("subtitle")}
                    </p>
                  </div>
                </div>
                <LanguageSwitcher />
              </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>

            <footer className="border-t border-gray-200 mt-16">
              <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
                {tFooter("text")}
              </div>
            </footer>
          </TRPCProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
