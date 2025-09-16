import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useRegistrationBillingReportingQuery } from "@/queries/admin/useReporting";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

export default function RegistrationReportPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const {data: _data, isLoading}= useRegistrationBillingReportingQuery(club?.club_account_id as string)

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <h1 className="text-base font-bold">Registration Report</h1>

      {/* Club Details */}
      {
        isLoading &&
        <div>loading...</div>
      }
      {
        !isLoading && 
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* <SectionCards /> */}
              <div className="px-4 lg:px-6">
                {/* <ChartAreaInteractive /> */}
              </div>
              {/* <DataTable data={data} /> */}
            </div>
          </div>
        </div>
      }
    </div>
  );
}