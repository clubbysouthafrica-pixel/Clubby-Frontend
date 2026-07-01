import { useContext, useRef, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useShopReportingQuery } from "@/queries/admin/useReporting";
import { ShopProductReport } from "@/components/admin/reporting/shop-reporting/shop-product-report";
import type { ShopReport } from "@/interfaces/report";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";
import { formatAmount } from "@/data/currencies";

export default function OrderReportingPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const reportingSectionRef = useRef<HTMLElement | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>("current");

  const seasonCycle = (club as { season_cycle?: number } | null)?.season_cycle;
  const seasonToFetch =
    selectedSeason === "current" ? undefined : parseInt(selectedSeason, 10);
  const availableSeasons = seasonCycle
    ? Array.from({ length: seasonCycle - 1 }, (_, index) => ({
        value: (seasonCycle - index - 1).toString(),
        label: `Season ${seasonCycle - index - 1}`,
      }))
    : [];

  const { data: shopReportingData, isLoading: shopReportingLoading } =
    useShopReportingQuery(club?.club_account_id as string, seasonToFetch);

  const shopReportItems: ShopReport["report"] = shopReportingData?.report ?? [];

  const summary = {
    products: shopReportItems.length,
    totalRevenue: shopReportItems.reduce(
      (sum, p) => sum + (p.total_revenue || 0),
      0,
    ),
    pendingRevenue: shopReportItems.reduce(
      (sum, p) => sum + (p.total_pending_revenue || 0),
      0,
    ),
    unitsSold: shopReportItems.reduce(
      (sum, p) => sum + (p.total_sold_units || 0),
      0,
    ),
    pendingUnits: shopReportItems.reduce(
      (sum, p) => sum + (p.total_pending_units || 0),
      0,
    ),
  };

  const scrollIntoView = () => {
    window.setTimeout(() => {
      reportingSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  };

  const handleDownload = () => {
    if (!shopReportingData?.report?.length) return;

    const headers = ["Product Name", "Total Revenue", "Pending Revenue", "Units Sold", "Pending Units"];
    const rows = shopReportingData.report.map(
      (p: ShopReport["report"][number]) =>
        `"${p.product_name}","${p.total_revenue || 0}","${p.total_pending_revenue || 0}","${p.total_sold_units || 0}","${p.total_pending_units || 0}"`,
    );
    const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");

    const element = document.createElement("a");
    const file = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    element.href = URL.createObjectURL(file);
    element.download = `Shop_Report_${new Date().toISOString().split("T")[0]}.csv`;
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-full bg-white text-slate-900">
      <section ref={reportingSectionRef} className="px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order Reporting</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review product revenue, pending balances, and unit sales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableSeasons.length > 0 && (
              <Select
                value={selectedSeason}
                onValueChange={(value) => {
                  setSelectedSeason(value);
                  scrollIntoView();
                }}
              >
                <SelectTrigger className="h-9 w-[160px] border-slate-200 bg-white text-sm text-slate-700 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Season</SelectItem>
                  {availableSeasons.map((season) => (
                    <SelectItem key={season.value} value={season.value}>
                      {season.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <button
              onClick={handleDownload}
              disabled={!shopReportingData?.report?.length}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {!shopReportingLoading && shopReportingData && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Products tracked", value: String(summary.products) },
              { label: "Total revenue", value: formatAmount(summary.totalRevenue, club?.currency ?? "ZAR") },
              { label: "Pending revenue", value: formatAmount(summary.pendingRevenue, club?.currency ?? "ZAR") },
              { label: "Units sold / pending", value: `${summary.unitsSold} / ${summary.pendingUnits}` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {shopReportingLoading ? (
          <div className="flex min-h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : shopReportingData ? (
          <ShopProductReport
            report={shopReportingData}
            currency={club?.currency ?? "ZAR"}
            onInteract={scrollIntoView}
          />
        ) : (
          <div className="flex min-h-48 items-center justify-center text-sm text-slate-400">
            No shop reporting data available.
          </div>
        )}
      </section>
    </div>
  );
}
