import EditClubDetails from "../dashboard/clubs/edit-club-details"

export default function OnboardClubPage() {
    return (
        <div className="flex flex-col gap-6 p-6 md:p-10">
          <div className="text-left">
          <div className="text-xl font-bold">Onboarding form</div>
          <div>
              This ensures that the club is ready to start taking members.
          </div>
          <div>Please make sure to update Banking details, Location and email.</div>
          </div>
          <div className="flex w-full max-w-lg flex-col gap-6">
            <EditClubDetails />
          </div>
        </div>
    )
}
