import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useMcsBillingReportingQuery } from "@/queries/admin/useReporting";
import ClubUsageAndCharges from "@/components/admin/billing-and-usage/club-usage-and-charges-report";
// import { ChartAreaInteractive } from "@/components/chart-area-interactive";

export default function BillingPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data, isLoading } = useMcsBillingReportingQuery(club?.club_account_id as string)
    console.log(data)
    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold mt-5">Billing and Usage</h1>
            {!isLoading &&
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                        {/* <SectionCards report={data} currency={club?.currency as string} /> */}
                        {/* <div className="px-4 lg:px-0">
                            <ChartAreaInteractive data={data?.data} />
                        </div> */}
                        <ClubUsageAndCharges data={data.report} />
                    </div>
                </div>
            }
        </div>
    );
}