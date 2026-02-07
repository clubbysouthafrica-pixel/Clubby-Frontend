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
    const { club } = useContext(ClubContext) as ClubContextType
    const [selectedSeason, setSelectedSeason] = useState<string>("current");
    
    const seasonToFetch = selectedSeason === "current" ? undefined : parseInt(selectedSeason);
    
    const { data: report, isLoading } = useShopReportingQuery(club?.club_account_id as string, seasonToFetch);

    const availableSeasons = club?.season_cycle ? Array.from(
        { length: club.season_cycle - 1 },
        (_, i) => ({
            value: (club.season_cycle - i - 1).toString(),
            label: `Season ${club.season_cycle - i - 1}`,
        })
    ) : [];

    const hasPreviousSeasons = availableSeasons.length > 0;

    const handleDownloadShopReport = () => {
        if (!report?.report) return;

        const headers = ["Product Name", "Total Revenue", "Pending Revenue", "Units Sold", "Pending Units"];
        const rows = report.report.map((product: any) => 
            `"${product.product_name}","${product.total_revenue || 0}","${product.total_pending_revenue || 0}","${product.total_sold_units || 0}","${product.total_pending_units || 0}"`
        );

        const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");
        
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header Section */}
            <div className="border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80">
                <div className="px-6 md:px-8 py-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
                                <ShoppingBag className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Shop Reports</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your shop's sales performance and inventory metrics by product</p>
                            </div>
                        </div>

                        {hasPreviousSeasons && (
                            <div className="w-full md:w-auto">
                                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                                    <SelectTrigger className="w-full md:w-[220px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg">
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
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-slate-600 dark:text-slate-400">Loading shop reports...</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {!isLoading && report && (
                <div className="px-6 md:px-8 py-8">
                    <div className="space-y-6">
                        <ShopProductReport report={report} currency={club?.currency ?? "ZAR"} />
                        <div className="flex justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                            <button
                                onClick={handleDownloadShopReport}
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 hover:shadow-sm"
                                title="Download report data as CSV"
                            >
                                <Download className="h-4 w-4" />
                                Export Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
