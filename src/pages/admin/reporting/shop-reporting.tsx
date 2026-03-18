import { useContext, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useShopReportingQuery } from "@/queries/admin/useReporting";
import { ShopProductReport } from "@/components/admin/reporting/shop-reporting/shop-product-report";
import { Loader2, Download, ShoppingBag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ShopReportingPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const [selectedSeason, setSelectedSeason] = useState<string>("current");

  const seasonToFetch =
    selectedSeason === "current" ? undefined : parseInt(selectedSeason);

  const { data: report, isLoading } = useShopReportingQuery(
    club?.club_account_id as string,
    seasonToFetch,
  );

  const availableSeasons = club?.season_cycle
    ? Array.from({ length: club.season_cycle - 1 }, (_, i) => ({
        value: (club.season_cycle - i - 1).toString(),
        label: `Season ${club.season_cycle - i - 1}`,
      }))
    : [];

  const hasPreviousSeasons = availableSeasons.length > 0;

  const handleDownloadShopReport = () => {
    if (!report?.report) return;

    const headers = [
      "Product Name",
      "Total Revenue",
      "Pending Revenue",
      "Units Sold",
      "Pending Units",
    ];
    const rows = report.report.map(
      (product: any) =>
        `"${product.product_name}","${product.total_revenue || 0}","${product.total_pending_revenue || 0}","${product.total_sold_units || 0}","${product.total_pending_units || 0}"`,
    );

    const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join(
      "\n",
    );

    const element = document.createElement("a");
    const file = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    element.href = URL.createObjectURL(file);
    const timestamp = new Date().toISOString().split("T")[0];
    element.download = `Shop_Report_${timestamp}.csv`;
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sticky Header */}
      <header className="z-40 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-inner">
              <ShoppingBag className="h-7 w-7 text-primary" />
            </span>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Shop Reports
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
                Track your shop's sales performance and inventory metrics by
                product
              </p>
            </div>
          </div>
          {hasPreviousSeasons && (
            <div className="w-full md:w-auto">
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="w-full md:w-[220px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
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
            </div>
          )}
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
              Loading shop reports...
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && report && (
        <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
          <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-slate-100 dark:border-slate-800">
            <ShopProductReport
              report={report}
              currency={club?.currency ?? "ZAR"}
            />
            <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
              <button
                onClick={handleDownloadShopReport}
                className="inline-flex items-center gap-2 px-5 py-3 text-base font-semibold rounded-lg bg-primary/90 text-white hover:bg-primary transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                title="Download report data as CSV"
              >
                <Download className="h-5 w-5" />
                Export Report
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
