import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { OverallReport } from "@/components/admin/reporting/general-reporting/overall-report";
import { RegistrationReport } from "@/components/admin/reporting/general-reporting/registration-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function GeneralReportingPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data: report, isLoading } = useGeneralReportingQuery(club?.club_account_id as string);

    if (isLoading) {
        return (
            <div className="p-5 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }
    
    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Club Reporting</h1>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Track your club’s financial and registration performance with interactive summaries, charts and detailed monthly breakdowns.</p>
            </div>
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
                    <Card className="p-6 shadow-sm border-none shadow-none">
                        {report && <RegistrationReport report={report} currency={club?.currency ?? "ZAR"} />}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}