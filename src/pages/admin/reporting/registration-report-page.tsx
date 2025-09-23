import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useRegistrationBillingReportingQuery } from "@/queries/admin/useReporting";
import { RegistrationReportData } from "@/components/registration-report-data-table";

export default function RegistrationReportPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const {data, isLoading}= useRegistrationBillingReportingQuery(club?.club_account_id as string)

  return (
    <div className="p-5 min-h-screen">
      <h1 className="text-base font-bold mt-5">Registration Report</h1>
      {
        isLoading &&
        <div>loading...</div>
      }
      {
        !isLoading && 
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-2 md:gap-6 md:py-2">
              <div className="px-0 lg:px-0 space-y-4">
                <RegistrationReportData data={data} currency={club?.currency as string} />
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  );
}