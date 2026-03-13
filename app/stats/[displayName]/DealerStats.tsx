"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { getBackgroundStyleCss, type StatsBackgroundStyle } from "@/lib/statsStyleShared";

type DealerRow = { total: number; count: number };
type DailyRow = { day: string; profit: number };

type DealerStatsProps = {
  uploaderId: string;
  pieChartColors: string[];
  barChartProfitColor: string;
  barChartLossColor: string;
  barChartDays: number;
  fontColor: string;
  containerBackground: StatsBackgroundStyle;
  elementBackground: StatsBackgroundStyle;
};

export function DealerStats({
  uploaderId,
  pieChartColors,
  barChartProfitColor,
  barChartLossColor,
  barChartDays,
  fontColor,
  containerBackground,
  elementBackground,
}: DealerStatsProps) {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<DealerRow[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);
  }, []);

  async function refresh(rebuild: boolean) {
    setBusy(true);
    setError(null);

    try {
      const url =
        `/api/dealer-stats?uploaderId=${encodeURIComponent(uploaderId)}&days=${encodeURIComponent(String(barChartDays))}` +
        (rebuild ? `&rebuild=1` : "");

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.message ?? "Failed to load dealer stats");
      }

      setRows(Array.isArray(json.rows) ? json.rows : []);
      setDaily(Array.isArray(json.daily) ? json.daily : []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
      setInitialized(true);
    }
  }

  useEffect(() => {
    setInitialized(false);
    setRows([]);
    setDaily([]);
    setError(null);

    if (uploaderId) void refresh(false);
  }, [uploaderId, barChartDays]);

  const totalHands = useMemo(() => rows.reduce((acc, r) => acc + (Number(r.count) || 0), 0), [rows]);
  const containerBackgroundStyle = useMemo(() => getBackgroundStyleCss(containerBackground), [containerBackground]);
  const elementBackgroundStyle = useMemo(() => getBackgroundStyleCss(elementBackground), [elementBackground]);

  const safePieColors = useMemo(() => {
    const colors = pieChartColors.length ? pieChartColors : ["#ff0000", "#d52d00", "#ff9a56", "#ffffff", "#d162a4", "#a30262"];
    return rows.map((_, i) => colors[i % colors.length]);
  }, [rows, pieChartColors]);

  const pieOptions = useMemo<ChartOptions<"pie">>(
    () => ({
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const label = String(ctx.label ?? "");
              const value = Number(ctx.parsed) || 0;
              const dataArr = (ctx.dataset?.data ?? []) as Array<number | string>;
              const total = dataArr.reduce<number>((acc, v) => acc + (Number(v) || 0), 0);
              const pct = total > 0 ? (value / total) * 100 : 0;
              return `${label}: ${value} (${pct.toFixed(1)}%)`;
            },
          },
        },
        legend: {
          display: true,
          labels: {
            color: fontColor,
          },
        },
      },
    }),
    [fontColor]
  );

  const pieData = useMemo(
    () => ({
      labels: rows.map((r) => (Number(r.total) === 0 ? "bust" : String(r.total))),
      datasets: [
        {
          label: "Count",
          data: rows.map((r) => r.count),
          backgroundColor: safePieColors,
          borderColor: safePieColors,
          borderWidth: 1,
        },
      ],
    }),
    [rows, safePieColors]
  );

  const dailyLabels = useMemo(() => daily.map((d) => d.day), [daily]);
  const dailyBarColors = useMemo(() => daily.map((d) => (Number(d.profit) >= 0 ? barChartProfitColor : barChartLossColor)), [daily, barChartProfitColor, barChartLossColor]);

  const dailyBarData = useMemo(
    () => ({
      labels: dailyLabels,
      datasets: [
        {
          label: "Dealer profit",
          data: daily.map((d) => Number(d.profit) || 0),
          backgroundColor: dailyBarColors,
          borderColor: dailyBarColors,
          borderWidth: 1,
        },
      ],
    }),
    [daily, dailyLabels, dailyBarColors]
  );

  if (!initialized) {
    return <div className="p-3 text-sm" style={{ color: fontColor }}>Loading dealer stats…</div>;
  }

  return (
    <div className="my-12">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold" style={{ color: fontColor }}>Dealer totals</div>
          <div className="text-sm opacity-70" style={{ color: fontColor }}>
            {busy ? "Loading…" : `${totalHands} dealer hands`}
          </div>
        </div>
      </div>

      {error ? <div className="mb-3 rounded-2xl border border-red-200 p-3 text-sm text-red-800" style={containerBackgroundStyle}>{error}</div> : null}

      {rows.length > 0 || daily.length > 0 ? (
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {rows.length > 0 ? (
            <div className="w-full rounded-2xl border border-black/10 p-3 md:w-1/2" style={elementBackgroundStyle}>
              <Pie data={pieData} options={pieOptions} />
            </div>
          ) : null}

          {daily.length > 0 ? (
            <div className="w-full rounded-2xl border border-black/10 p-3 md:w-1/2" style={elementBackgroundStyle}>
              <div className="mb-1 text-lg font-semibold" style={{ color: fontColor }}>
                Daily dealer profit (last {barChartDays} dealing days)
              </div>
              <div className="mb-3 text-sm opacity-70" style={{ color: fontColor }}>
                Profit and loss colors follow your admin settings
              </div>
              <Bar
                data={dailyBarData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                  },
                  scales: {
                    x: { ticks: { maxRotation: 0, autoSkip: true, color: fontColor }, grid: { color: `${fontColor}22` } },
                    y: { beginAtZero: false, ticks: { color: fontColor }, grid: { color: `${fontColor}22` } },
                  },
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
