import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useRegistrationBillingReportingQuery } from "@/queries/admin/useReporting";
// import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { RegistrationReportData } from "@/interfaces/report";
import { ChartAreaInteractiveRegistration } from "@/components/chart-area-interactive-registration";

export default function RegistrationReportPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const {data, isLoading}= useRegistrationBillingReportingQuery(club?.club_account_id as string)

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
              <div className="px-4 lg:px-6 space-y-4">
                {
                  data?.report?.length && data?.report.map((i: RegistrationReportData) => (
                    <div>
                      <p>{i.table_name}</p>

                      {
                        i.rows?.length && i.rows.map(m => (
                          <ChartAreaInteractiveRegistration key={m.row_name} data={m}/>
                        ))
                      }
                      
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  );
}