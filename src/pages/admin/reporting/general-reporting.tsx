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
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold mb-2">Club Financial Reporting</h1>
            <Tabs defaultValue="overall">
                <TabsList>
                    <TabsTrigger className="w-[200px]" key="overall" value="overall">Overall</TabsTrigger>
                    <TabsTrigger className="w-[200px]" key="registration" value="registration">Registration</TabsTrigger>
                </TabsList>
                <TabsContent key="overall" value="overall">
                    <Card className="p-4">
                        {!isLoading && report &&
                            <OverallReport report={report} currency={club?.currency ?? "ZAR"} />
                        }
                    </Card>
                </TabsContent>
                <TabsContent key="registration" value="registration">
                    <Card className="p-4">
                        {!isLoading && report &&
                            <RegistrationReport report={report} currency={club?.currency ?? "ZAR"} />
                        }
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}