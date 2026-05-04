import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClub } from "@/queries/admin/clubs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageUploadDialog from "@/components/image-upload-dialog";
import ShareClubDialog from "@/components/share-club-dialog";
import EditClubDetails from "@/components/admin/club/manage-club/edit-club-details";
import { updateClubDetails } from "@/services/admin/club";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function ManageClubDashboard() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext,
  ) as ClubContextType;
  const { setClub } = useContext(ClubContext) as ClubContextType;
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const missing = searchParams.get("missing");
  const [isEditingClubName, setIsEditingClubName] = useState(false);
  const [clubName, setClubName] = useState("");
  const [isSavingClubName, setIsSavingClubName] = useState(false);

  // Determine which tab should be active based on missing query param
  let initialTab = undefined;
  if (missing === "currency" || missing === "country") {
    initialTab = "location";
  } else if (missing === "bank_details") {
    initialTab = "account";
  }

  const { data: clubDetails, isLoading: detailsLoading } = useFetchClub(
    club?.club_account_id as string,
    { includeImages: true },
  );

  useEffect(() => {
    if (clubDetails?.club_name) {
      setClubName(clubDetails.club_name);
    }
  }, [clubDetails?.club_name]);

  const handleSaveClubName = async () => {
    const trimmedClubName = clubName.trim();

    if (!club?.club_account_id) {
      return;
    }

    if (!trimmedClubName) {
      toast.error("Club name is required");
      return;
    }

    if (trimmedClubName === clubDetails?.club_name) {
      setIsEditingClubName(false);
      return;
    }

    try {
      setIsSavingClubName(true);
      await updateClubDetails({
        club_account_id: club.club_account_id,
        club_name: trimmedClubName,
      });

      if (club) {
        setClub({
          ...club,
          club_name: trimmedClubName,
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ["getClub", club.club_account_id],
      });

      toast.success("Club name updated successfully");
      setIsEditingClubName(false);
    } catch (error) {
      const errorMessage =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "Something went wrong";

      toast.error(errorMessage);
    } finally {
      setIsSavingClubName(false);
    }
  };

  if (
    clubLoading ||
    detailsLoading ||
    !clubDetails ||
    !clubDetails?.images?.cover ||
    !clubDetails?.images?.profile
  ) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manage Club Page
          </h1>
          <p className="text-muted-foreground">Manage your club</p>
      </div>

      <div className="w-full space-y-6 min-h-screen">
        {!detailsLoading && club?.club_account_id && (
          <div className="w-full">
            <ImageUploadDialog
              title="Cover Image"
              className="h-28 w-full rounded-none sm:h-36 md:h-56"
              description="Upload a new cover image."
              presignedUrl={clubDetails.images.cover.uploadUrl}
              imageUrl={clubDetails.images.cover?.fetchUrl ?? ""}
            />
            <div className="flex items-start">
              <ImageUploadDialog
                title="Profile Image"
                description="Upload a new profile image."
                presignedUrl={clubDetails.images.profile.uploadUrl}
                imageUrl={clubDetails.images.profile?.fetchUrl ?? ""}
                className="-mt-7 ml-4 h-16 w-16 rounded-full border-4 border-white shadow-[0_18px_36px_-20px_rgba(14,116,144,0.45)] sm:-mt-10 sm:h-24 sm:w-24 md:-mt-14"
              />
              <div className="mt-2 ml-auto">
                <ShareClubDialog clubId={club.club_account_id} />
              </div>
            </div>
          </div>
        )}
        {!detailsLoading && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {isEditingClubName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={clubName}
                    onChange={(event) => setClubName(event.target.value)}
                    className="h-10 min-w-[240px] text-2xl font-semibold"
                    disabled={isSavingClubName}
                    autoFocus
                  />
                  <Button
                    onClick={handleSaveClubName}
                    disabled={isSavingClubName}
                  >
                    {isSavingClubName ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setClubName(clubDetails?.club_name || "");
                      setIsEditingClubName(false);
                    }}
                    disabled={isSavingClubName}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-4xl">{clubDetails?.club_name}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingClubName(true)}
                    aria-label="Edit club name"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <div>
              <Badge>{clubDetails?.club_type}</Badge>
            </div>
          </div>
        )}
        <EditClubDetails initialTab={initialTab} />
      </div>
    </div>
  );
}
