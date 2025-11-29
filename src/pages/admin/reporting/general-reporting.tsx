import { useContext, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { OverallReport } from "@/components/admin/reporting/general-reporting/overall-report";
import { RegistrationReport } from "@/components/admin/reporting/general-reporting/registration-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
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
    
    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Club Reporting</h1>
                <p className="text-sm text-muted-foreground mx-auto">Track your club's financial and registration performance with interactive summaries, charts and detailed monthly breakdowns.</p>
            </div>

            {hasPreviousSeasons && (
                <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                        <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                            <SelectTrigger className="w-full">
                                <div className="flex-1 text-center">
                                    <SelectValue />
                                </div>
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
                    </TabsContent>
                    <TabsContent key="registration" value="registration" className="space-y-4">
                        <Card className="px-6 py-0 shadow-sm border-none shadow-none">
                            {report && <RegistrationReport report={report} currency={club?.currency ?? "ZAR"} />}
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}