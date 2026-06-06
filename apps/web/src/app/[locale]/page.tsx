import { getTranslations } from "next-intl/server";
import { RouteList } from "@/components/RouteList";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-saar-blue">{t("headline")}</h2>
        <p className="text-gray-600 max-w-xl mx-auto">{t("description")}</p>
      </div>

      <div className="bg-saar-light border-l-4 border-saar-blue rounded-r-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-saar-blue mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="3" width="16" height="13" rx="2" />
              <path d="M4 11h16" />
              <path d="M12 3v8" />
              <path d="M8 19l-2 3" />
              <path d="M18 22l-2-3" />
              <path d="M8 19h8" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-saar-blue">{t("bannerRoute")}</p>
            <p className="text-sm text-gray-600 mt-0.5">{t("bannerDetails")}</p>
          </div>
        </div>
      </div>

      <RouteList />
    </div>
  );
}
