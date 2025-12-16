import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClub } from "@/queries/admin/clubs";
import { Badge } from "@/components/ui/badge";
import ImageUploadDialog from "@/components/image-upload-dialog";
import ShareClubDialog from "@/components/share-club-dialog";
import EditClubDetails from "./edit-club-details";
import { Loader2 } from "lucide-react";

export default function ManageClubDashboard() {
  const { club, isLoading: clubLoading } = useContext(ClubContext) as ClubContextType;
  const { data: clubDetails, isLoading: detailsLoading } = useFetchClub(
    club?.club_account_id as string,
    { includeImages: true }
  );

  if (clubLoading || detailsLoading || !clubDetails || !clubDetails?.images?.cover || !clubDetails?.images?.profile) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <h1 className="text-base font-bold">Manage Club Page</h1>
      {!detailsLoading && club?.club_account_id && (
        <div className="w-full">
          <ImageUploadDialog
            title="Cover Image"
            className="h-28 md:h-28"
            description="Upload a new cover image."
            presignedUrl={clubDetails.images.cover.uploadUrl}
            imageUrl={clubDetails.images.cover?.fetchUrl ?? ""}
          />
          <div className="flex content-center">
            <ImageUploadDialog
              title="Profile Image"
              description="Upload a new profile image."
              presignedUrl={clubDetails.images.profile.uploadUrl}
              imageUrl={clubDetails.images.profile?.fetchUrl ?? ""}
              className="rounded-full w-28 h-28 -mt-14 ml-6 border-4 border-background shadow-lg"
            />
            <div className="mt-2 ml-auto">
              <ShareClubDialog clubId={club.club_account_id} />
            </div>
          </div>
        </div>
      )}
      {!detailsLoading && (
        <div className="flex space-x-4 content-center">
          <div className="text-4xl">{clubDetails?.club_name}</div>
          <div className="content-ceter self-center">
            <Badge>{clubDetails?.club_type}</Badge>
          </div>
        </div>
      )}
      <EditClubDetails />
    </div>
  );
}
