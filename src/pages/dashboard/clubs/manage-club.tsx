import { useContext } from "react";
// import { useFetchClubMembers } from "@/queries/admin/club-members";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClub } from "@/queries/admin/clubs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import ImageUploadDialog from "@/components/image-upload-dialog";
import { clubCoverImagePresignedUrl } from "@/services/image";
import { clubProfileImagePresignedUrl } from "@/services/admin/image";
import ShareClubDialog from "@/components/share-club-dialog";
import EditClubDetails from "./edit-club-details";

export default function ManageClubDashboard() {
    const { club } = useContext(ClubContext) as ClubContextType
    // const { data: clubMembers } = useFetchClubMembers(club?.club_account_id as string)
    const { data: clubDetails, isLoading: clubLoading } = useFetchClub(club?.club_account_id as string)

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <h1 className="text-base font-bold">Manage Club Page</h1>

      {/* Club Details */}
      {
        clubLoading &&
        <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
      {
        !clubLoading && club?.club_account_id &&
        <div className="w-full">
            <ImageUploadDialog title="Cover Image" className="h-30" description="Upload a new cover image." presignedUrlApi={clubCoverImagePresignedUrl(club.club_account_id)}/>
            <div className="flex content-center">
                <div className="rounded-full overflow-hidden w-28 h-28 -mt-14 ml-6 cursor-pointer hover:shadow-xl">
                    <ImageUploadDialog title="Profile Image" description="Upload a new profile image." presignedUrlApi={clubProfileImagePresignedUrl(club.club_account_id)}/>
                </div>
                {/* <div className="mt-2 ml-2 space-x-1">
                    <Badge variant="outline">{clubMembers?.registered?.length} Active Members</Badge>
                    <Badge variant="default">{clubMembers?.unregistered?.length ?? clubMembers?.not_registered?.length} Pending Members</Badge>
                </div> */}
                <div className="mt-2 ml-auto">
                    <ShareClubDialog clubId={club.club_account_id}/>
                </div>
            </div>
        </div>
      }
      {
        !clubLoading && 
        <div className="flex space-x-4 content-center">
            <div className="text-4xl">{clubDetails?.club_name}</div>
            <div className="content-ceter self-center"><Badge>{clubDetails?.club_type}</Badge></div>
        </div>
      }
      <EditClubDetails/>
    </div>
  );
}