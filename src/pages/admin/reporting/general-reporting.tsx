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
    const { club } = useContext(ClubContext) as ClubContextType
    const [selectedSeason, setSelectedSeason] = useState<string>("current");
    
    const seasonToFetch = selectedSeason === "current" ? undefined : parseInt(selectedSeason);
    
    const { data: report, isLoading } = useGeneralReportingQuery(club?.club_account_id as string, seasonToFetch);

    const availableSeasons = club?.season_cycle ? Array.from(
        { length: club.season_cycle - 1 },
        (_, i) => ({
            value: (club.season_cycle - i - 1).toString(),
            label: `Season ${club.season_cycle - i - 1}`,
        })
    ) : [];

    const hasPreviousSeasons = availableSeasons.length > 0;

    const handleDownloadOverallReport = () => {
        if (!report?.data) return;

        const headers = ["Month", "Revenue", "Pending Revenue"];
        const rows = report.data.map((month: any) => 
            `"${month.date}","${month.total_revenue || 0}","${month.total_pending_revenue || 0}"`
        );

        const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");
        
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

        const headers = ["Month", "Registration Revenue", "Pending Registration Revenue", "Fully Paid Registrations", "De-registrations"];
        const rows = report.registration_data.map((month: any) => 
            `"${month.date}","${month.total_revenue || 0}","${month.total_pending_revenue || 0}","${month.total_registered_members || 0}","${month.total_deregistered_members || 0}"`
        );

        const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");
        
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

        const headers = ["Month", "Order Revenue", "Pending Order Revenue", "Items Sold", "Pending Items"];
        const rows = report.order_data.map((month: any) => 
            `"${month.date}","${month.total_revenue || 0}","${month.total_pending_revenue || 0}","${month.total_shop_sold_items || 0}","${month.total_shop_pending_sold_items || 0}"`
        );

        const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");
        
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
        switch(tab) {
            case "overall": return handleDownloadOverallReport;
            case "registration": return handleDownloadRegistrationReport;
            case "orders": return handleDownloadOrdersReport;
            default: return () => {};
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header Section */}
            <div className="border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80">
                <div className="px-6 md:px-8 py-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
                                <BarChart3 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Club Analytics</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor your club's financial and operational metrics</p>
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
                        <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {!isLoading && (
                <Tabs defaultValue="overall" className="w-full">
                    {/* Modern Tab Navigation */}
                    <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md sticky top-[88px] z-30">
                        <div className="px-6 md:px-8">
                            <TabsList className="grid w-fit grid-cols-3 gap-2 bg-transparent p-0 h-auto">
                                <TabsTrigger 
                                    value="overall"
                                    className="px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-primary data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                >
                                    Overall
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="registration"
                                    className="px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-primary data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                >
                                    Registration
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="orders"
                                    className="px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-primary data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                >
                                    Orders
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </div>

                    {/* Tab Content Container */}
                    <div className="px-6 md:px-8 py-8">
                        {/* Overall Tab */}
                        <TabsContent value="overall" className="space-y-6 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-300 m-0">
                            {report && <OverallReport report={report} currency={club?.currency ?? "ZAR"} />}
                            <div className="flex justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                                <button
                                    onClick={getDownloadHandler("overall")}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 hover:shadow-sm"
                                    title="Download report data as CSV"
                                >
                                    <Download className="h-4 w-4" />
                                    Export Report
                                </button>
                            </div>
                        </TabsContent>

                        {/* Registration Tab */}
                        <TabsContent value="registration" className="space-y-6 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-300 m-0">
                            {report && <RegistrationReport report={report} currency={club?.currency ?? "ZAR"} />}
                            <div className="flex justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                                <button
                                    onClick={getDownloadHandler("registration")}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 hover:shadow-sm"
                                    title="Download report data as CSV"
                                >
                                    <Download className="h-4 w-4" />
                                    Export Report
                                </button>
                            </div>
                        </TabsContent>

                        {/* Orders Tab */}
                        <TabsContent value="orders" className="space-y-6 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-300 m-0">
                            {report && <OrdersReport report={report} currency={club?.currency ?? "ZAR"} />}
                            <div className="flex justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                                <button
                                    onClick={getDownloadHandler("orders")}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 hover:shadow-sm"
                                    title="Download report data as CSV"
                                >
                                    <Download className="h-4 w-4" />
                                    Export Report
                                </button>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            )}
        </div>
    );
}
