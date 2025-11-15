import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useRegistrationBillingReportingQuery } from "@/queries/admin/useReporting";
import { RegistrationReportData } from "@/components/registration-report-data-table";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RegistrationReportPage() {
  const { club } = useContext(ClubContext) as ClubContextType
  const { data, isLoading } = useRegistrationBillingReportingQuery(club?.club_account_id as string)


  if (isLoading) {
    return (
      <div className="p-5 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  console.log('DATA: ', data)
  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Registration Billing</h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Analyze each registration fee with monthly totals, pending counts, paid amounts and amounts due to your club.</p>
      </div>
      <Card className="p-6 shadow-sm border-none shadow-none">
        {data && <RegistrationReportData data={data} currency={club?.currency as string} />}
      </Card>
    </div>
  );
}