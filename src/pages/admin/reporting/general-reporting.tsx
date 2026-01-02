import { useContext, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { OverallReport } from "@/components/admin/reporting/general-reporting/overall-report";
import { RegistrationReport } from "@/components/admin/reporting/general-reporting/registration-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
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
        if (!report?.data) return;

        const headers = ["Month", "Registration Revenue", "Pending Registration Revenue", "Fully Paid Registrations", "De-registrations"];
        const rows = report.data.map((month: any) => 
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
    
    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Club Reporting</h1>
                <p className="text-sm text-muted-foreground mx-auto">Track your club's financial and registration performance with interactive summaries, charts and detailed monthly breakdowns.</p>
            </div>

            {hasPreviousSeasons && (
                <div className="flex justify-center">
                    <div className="bg-gray-100 rounded-lg p-3 w-[200px]">
                        <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                            <SelectTrigger className="w-full text-center border-0 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="text-center">
                                <SelectItem value="current" className="text-center">Current Season</SelectItem>
                                {availableSeasons.map((season) => (
                                    <SelectItem key={season.value} value={season.value} className="text-center">
                                        {season.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}

            {!isLoading && (
                <Tabs defaultValue="overall" className="space-y-4">
                    <TabsList className="grid grid-cols-2 max-w-md mx-auto">
                        <TabsTrigger key="overall" value="overall">Overall</TabsTrigger>
                        <TabsTrigger key="registration" value="registration">Registration</TabsTrigger>
                    </TabsList>
                    <TabsContent key="overall" value="overall" className="space-y-4">
                        <Card className="px-6 py-0 shadow-sm border border-none shadow-none">
                            {report && <OverallReport report={report} currency={club?.currency ?? "ZAR"} />}
                        </Card>
                        <button
                            onClick={handleDownloadOverallReport}
                            className="p-2 w-fit bg-transparent cursor-pointer hover:bg-gray-100 transition rounded-md"
                            title="Download report data as CSV"
                        >
                            <Download className="h-5 w-5 text-green-600" />
                        </button>
                    </TabsContent>
                    <TabsContent key="registration" value="registration" className="space-y-4">
                        <Card className="px-6 py-0 shadow-sm border-none shadow-none">
                            {report && <RegistrationReport report={report} currency={club?.currency ?? "ZAR"} />}
                        </Card>
                        <button
                            onClick={handleDownloadRegistrationReport}
                            className="p-2 w-fit bg-transparent cursor-pointer hover:bg-gray-100 transition rounded-md"
                            title="Download report data as CSV"
                        >
                            <Download className="h-5 w-5 text-green-600" />
                        </button>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}