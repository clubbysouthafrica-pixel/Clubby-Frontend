import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useRegistrationBillingReportingQuery } from "@/queries/admin/useReporting";

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
        <div className="flex space-x-4 content-center">

        </div>
      }
    </div>
  );
}