import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useMcsBillingReportingQuery } from "@/queries/admin/useReporting";
import ClubUsageAndCharges from "@/components/admin/billing-and-usage/club-usage-and-charges-report";
import { formatAmount } from "@/data/currencies";
import { Loader2 } from "lucide-react";

export default function BillingPage() {
    const { club } = useContext(ClubContext) as ClubContextType;
    const { data, isLoading } = useMcsBillingReportingQuery(
        club?.club_account_id as string
    );

    if (isLoading || !data) {
        return (
            <div className="p-5 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }
    return (
        <div className="p-5">
            <h3 className="text-xl font-bold mb-4 pb-2">You Owe Clubby: {formatAmount(data.report.total_outstanding_amount, club?.currency)}</h3>
            <div className="@container/main flex flex-1 flex-col gap-1">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                    <ClubUsageAndCharges
                        data={data.report ?? {}}
                        currency={club?.currency ?? "ZAR"}
                    />
                </div>
            </div>
        </div>
    );
}