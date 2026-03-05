import { useContext, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { OverallReport } from "@/components/admin/reporting/general-reporting/overall-report";
import { RegistrationReport } from "@/components/admin/reporting/general-reporting/registration-report";
import { OrdersReport } from "@/components/admin/reporting/general-reporting/orders-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GeneralReportingPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const [selectedSeason, setSelectedSeason] = useState<string>("current");

  const seasonToFetch =
    selectedSeason === "current" ? undefined : parseInt(selectedSeason);

  const { data: report, isLoading } = useGeneralReportingQuery(
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

  // --- Download Handlers (unchanged) ---
  const handleDownloadOverallReport = () => {
    if (!report?.data) return;
    const headers = ["Month", "Revenue", "Pending Revenue"];
    const rows = report.data.map(
      (month: any) =>
        `"${month.date}","${month.total_revenue || 0}","${month.total_pending_revenue || 0}"`,
    );
    const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join(
      "\n",
    );
    const element = document.createElement("a");
    const file = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    element.href = URL.createObjectURL(file);
    const timestamp = new Date().toISOString().split("T")[0];
    element.download = `Overall_Report_${timestamp}.csv`;
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadRegistrationReport = () => {
    if (!report?.registration_data) return;
    const headers = [
      "Month",
      "Registration Revenue",
      "Pending Registration Revenue",
      "Fully Paid Registrations",
      "De-registrations",
    ];
    const rows = report.registration_data.map(
      (month: any) =>
        `"${month.date}","${month.total_revenue || 0}","${month.total_pending_revenue || 0}","${month.total_registered_members || 0}","${month.total_deregistered_members || 0}"`,
    );
    const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join(
      "\n",
    );
    const element = document.createElement("a");
    const file = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    element.href = URL.createObjectURL(file);
    const timestamp = new Date().toISOString().split("T")[0];
    element.download = `Registration_Report_${timestamp}.csv`;
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadOrdersReport = () => {
    if (!report?.order_data) return;
    const headers = [
      "Month",
      "Order Revenue",
      "Pending Order Revenue",
      "Items Sold",
      "Pending Items",
    ];
    const rows = report.order_data.map(
      (month: any) =>
        `"${month.date}","${month.total_revenue || 0}","${month.total_pending_revenue || 0}","${month.total_shop_sold_items || 0}","${month.total_shop_pending_sold_items || 0}"`,
    );
    const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join(
      "\n",
    );
    const element = document.createElement("a");
    const file = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    element.href = URL.createObjectURL(file);
    const timestamp = new Date().toISOString().split("T")[0];
    element.download = `Orders_Report_${timestamp}.csv`;
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getDownloadHandler = (tab: string) => {
    switch (tab) {
      case "overall":
        return handleDownloadOverallReport;
      case "registration":
        return handleDownloadRegistrationReport;
      case "orders":
        return handleDownloadOrdersReport;
      default:
        return () => {};
    }
  };

  // --- Modernized Layout ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-inner">
              <BarChart3 className="h-7 w-7 text-primary" />
            </span>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Club Analytics
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
                Monitor your club’s financial and operational metrics
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
              Loading analytics...
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
          <Tabs defaultValue="overall" className="w-full">
            {/* Tab Navigation */}
            <div className="sticky top-[88px] z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
              <TabsList className="flex gap-2 bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="overall"
                  className="px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Overall
                </TabsTrigger>
                <TabsTrigger
                  value="registration"
                  className="px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Registration
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Orders
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="py-8">
              <TabsContent value="overall" className="animate-fade-in">
                <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 mb-8 border border-slate-100 dark:border-slate-800">
                  {report && (
                    <OverallReport
                      report={report}
                      currency={club?.currency ?? "ZAR"}
                    />
                  )}
                  <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                    <button
                      onClick={getDownloadHandler("overall")}
                      className="inline-flex items-center gap-2 px-5 py-3 text-base font-semibold rounded-lg bg-primary/90 text-white hover:bg-primary transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      title="Download report data as CSV"
                    >
                      <Download className="h-5 w-5" />
                      Export Report
                    </button>
                  </div>
                </section>
              </TabsContent>
              <TabsContent value="registration" className="animate-fade-in">
                <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 mb-8 border border-slate-100 dark:border-slate-800">
                  {report && (
                    <RegistrationReport
                      report={report}
                      currency={club?.currency ?? "ZAR"}
                    />
                  )}
                  <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                    <button
                      onClick={getDownloadHandler("registration")}
                      className="inline-flex items-center gap-2 px-5 py-3 text-base font-semibold rounded-lg bg-primary/90 text-white hover:bg-primary transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      title="Download report data as CSV"
                    >
                      <Download className="h-5 w-5" />
                      Export Report
                    </button>
                  </div>
                </section>
              </TabsContent>
              <TabsContent value="orders" className="animate-fade-in">
                <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 mb-8 border border-slate-100 dark:border-slate-800">
                  {report && (
                    <OrdersReport
                      report={report}
                      currency={club?.currency ?? "ZAR"}
                    />
                  )}
                  <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                    <button
                      onClick={getDownloadHandler("orders")}
                      className="inline-flex items-center gap-2 px-5 py-3 text-base font-semibold rounded-lg bg-primary/90 text-white hover:bg-primary transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      title="Download report data as CSV"
                    >
                      <Download className="h-5 w-5" />
                      Export Report
                    </button>
                  </div>
                </section>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      )}
    </div>
  );
}
