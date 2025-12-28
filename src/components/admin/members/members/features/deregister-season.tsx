import { useContext, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useDeregisterAllMutation } from "@/mutations/admin/useDeregisterMutation";
import { toast } from "sonner";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface ImageProps {
  clubId: string;
}

export default function DeregisterSeasonDialog({ clubId }: ImageProps) {
  const { logout } = useContext(AuthContext) as AuthContextType;
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate, isPending, isSuccess } = useDeregisterAllMutation();

  const send = () => {
    mutate(
      { clubId: clubId },
      {
        onSuccess: () => {
          toast.success("Season restart is in progress...");
          logout();
          navigate("/login");
        },
        onError: (error: unknown) => {
          const errObj = error as Record<string, unknown> | undefined;
          const resp = errObj?.response as Record<string, unknown> | undefined;
          const statusCode = resp?.status as number | undefined;

          if (statusCode === 410) {
            setErrorMessage(
              "You have an outstanding balance with Clubby that needs to be paid before you can start a new season.",
            );
          } else {
            const msg =
              ((resp?.data as Record<string, unknown> | undefined)?.message as
                | string
                | undefined) ?? String(error ?? "An error occurred");
            setErrorMessage(msg);
          }
        },
      },
    );
  };

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (!open) {
      setConfirmed(false);
      setErrorMessage(null);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpenDialog(true)}
              aria-label="Deregister season"
              variant="outline"
            >
              <UserMinus />
              Deregister Season
            </Button>
          </TooltipTrigger>
          <TooltipContent className="mr-2">
            <p>
              Deregister all members and start a new season (resets club data).
            </p>
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] md:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>Start New Club Season</DialogTitle>
          <DialogDescription>
            {errorMessage ? (
              <div className="text-red-600">
                <p>{errorMessage}</p>
                {errorMessage.includes("outstanding balance") && (
                  <button
                    onClick={() => navigate("/billing&usage")}
                    className="mt-3 underline text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Click here to see outstanding balances
                  </button>
                )}
              </div>
            ) : (
              <div>
                <span>
                  This action is intended to prepare the club for a fresh season
                  with new member registrations and updated data.
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        {!errorMessage && (
          <>
            <div className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">What happens next:</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>All members will be placed in the members requiring re registration table</li>
                <li>All members will need to resubmit registrations to join the club again</li>
                <li>All reporting for the current season is set to 0</li>
                <li>The previous season reporting can still be found under the reporting season but is historical</li>
              </ul>
            </div>
            <div>
              <span className="text-red-600">
                  ⚠️ This process is irreversible. Archived data will remain
                  accessible in a read-only format, but current members will
                  lose access and must register again for the new season.
                </span>
            </div>
            <div className="flex items-center gap-1">
              <Checkbox
                id="consent"
                onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
              />
              
              <DialogDescription className="text-black">
                I understand want to start a new season and deregister all current members.
              </DialogDescription>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                className="bg-red-700 hover:bg-red-800 text-white"
                disabled={!confirmed || isPending || isSuccess}
                onClick={send}
              >
                {isPending ? "loading..." : "Start new season"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
