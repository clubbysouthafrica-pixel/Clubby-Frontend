import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useMcsBillingReportingQuery } from "@/queries/admin/useReporting";
import ClubUsageAndCharges from "@/components/admin/billing-and-usage/club-usage-and-charges-report";

export default function BillingPage() {
    const { club } = useContext(ClubContext) as ClubContextType;
    const { data, isLoading } = useMcsBillingReportingQuery(
        club?.club_account_id as string
    );

    if (isLoading || !data) {
        return <div className="p-5">Loading...</div>;
    }

    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-xl font-bold mb-4 pb-2">Usage & Charges Summary</h1>
            <div className="@container/main flex flex-1 flex-col gap-2">
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