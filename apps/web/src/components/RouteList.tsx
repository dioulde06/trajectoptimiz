"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/trpc/client";
import { CreateRouteSchema, KNOWN_STOPS } from "@trajectoptimiz/validators";
import type { AppRouter } from "@trajectoptimiz/api";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type DelayAnalysis = RouterOutputs["routes"]["analyzeDelay"];

const DEMO_USER_ID = "cjld2cjxh0000qzrmn831i7rn";

function confidenceKey(level: string): "confidenceLow" | "confidenceMedium" | "confidenceHigh" {
  if (level === "moyen") return "confidenceMedium";
  if (level === "élevé") return "confidenceHigh";
  return "confidenceLow";
}

function DelayBadge({ analysis }: { analysis: DelayAnalysis }) {
  const t = useTranslations("analysis");
  const prob = analysis.delayProbability;
  const color =
    prob >= 70
      ? "bg-red-100 text-red-700"
      : prob >= 40
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  const delayText =
    analysis.predictedDelayMinutes > 0
      ? t("delayPositive", { min: analysis.predictedDelayMinutes })
      : analysis.predictedDelayMinutes < 0
      ? t("delayNegative", { min: analysis.predictedDelayMinutes })
      : t("onTime");

  return (
    <div className="mt-2 space-y-1.5 text-sm">
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-xs ${color}`}>
          {t("delayProbability", { prob })}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium text-xs bg-gray-100 text-gray-600">
          {delayText} · {t(confidenceKey(analysis.confidenceLevel))}
        </span>
      </div>
      {analysis.factors.length > 0 && (
        <p className="text-gray-500 text-xs">
          {t("factors", { list: analysis.factors.join(", ") })}
        </p>
      )}
      <p className="text-gray-600 text-xs italic">{analysis.recommendation}</p>
    </div>
  );
}

function RouteAnalysisButton({ routeId }: { routeId: string }) {
  const t = useTranslations("analysis");
  const [enabled, setEnabled] = useState(false);
  const { data, isLoading, error } = trpc.routes.analyzeDelay.useQuery(
    { routeId },
    { enabled }
  );

  if (isLoading) {
    return <span className="text-xs text-gray-400 animate-pulse">{t("loading")}</span>;
  }

  if (error) {
    return <span className="text-xs text-red-500">{t("error")}</span>;
  }

  if (data) {
    return <DelayBadge analysis={data} />;
  }

  return (
    <button
      onClick={() => setEnabled(true)}
      className="text-xs text-saar-blue underline hover:no-underline mt-1"
    >
      {t("trigger")}
    </button>
  );
}

export function RouteList() {
  const t = useTranslations("routeList");

  const [fromStop, setFromStop] = useState<string>(KNOWN_STOPS[0]!);
  const [toStop, setToStop] = useState<string>(KNOWN_STOPS[KNOWN_STOPS.length - 1]!);
  const [routeName, setRouteName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: routes, isLoading, refetch } = trpc.routes.getAll.useQuery({
    userId: DEMO_USER_ID,
  });

  const createRoute = trpc.routes.create.useMutation({
    onSuccess: () => {
      setRouteName("");
      setFormError(null);
      void refetch();
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const deleteRoute = trpc.routes.delete.useMutation({
    onSuccess: () => void refetch(),
    onError: (error) => {
      console.error("Delete error:", error.message);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const validation = CreateRouteSchema.safeParse({
      name: routeName,
      fromStop,
      toStop,
      userId: DEMO_USER_ID,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message ?? t("invalidData"));
      return;
    }

    createRoute.mutate(validation.data);
  }

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("addTitle")}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="route-name" className="block text-sm font-medium text-gray-700 mb-1">
              {t("nameLabel")}
            </label>
            <input
              id="route-name"
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="input"
              required
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="from-stop" className="block text-sm font-medium text-gray-700 mb-1">
                {t("fromLabel")}
              </label>
              <select
                id="from-stop"
                value={fromStop}
                onChange={(e) => setFromStop(e.target.value)}
                className="input"
              >
                {KNOWN_STOPS.map((stop) => (
                  <option key={stop} value={stop}>{stop}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="to-stop" className="block text-sm font-medium text-gray-700 mb-1">
                {t("toLabel")}
              </label>
              <select
                id="to-stop"
                value={toStop}
                onChange={(e) => setToStop(e.target.value)}
                className="input"
              >
                {KNOWN_STOPS.map((stop) => (
                  <option key={stop} value={stop}>{stop}</option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full sm:w-auto"
            disabled={createRoute.isPending}
          >
            {createRoute.isPending ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("savedTitle")}</h2>

        {isLoading && (
          <div className="text-center py-8 text-gray-500">{t("loading")}</div>
        )}

        {!isLoading && (!routes || routes.length === 0) && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">{t("empty")}</p>
            <p className="text-sm text-gray-400">{t("emptyHint")}</p>
          </div>
        )}

        {routes && routes.length > 0 && (
          <ul className="divide-y divide-gray-100 space-y-0">
            {routes.map((route) => (
              <li
                key={route.id}
                className="flex items-start justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{route.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="text-saar-blue font-medium">{route.fromStop}</span>
                    <span className="mx-2">→</span>
                    <span className="text-saar-blue font-medium">{route.toStop}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t("trips", { count: route._count.tripHistories })}
                  </p>
                  <RouteAnalysisButton routeId={route.id} />
                </div>

                <button
                  onClick={() => deleteRoute.mutate({ id: route.id })}
                  disabled={deleteRoute.isPending}
                  className="btn-danger ml-4 flex-shrink-0"
                  aria-label={t("deleteLabel", { name: route.name })}
                >
                  {t("delete")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
