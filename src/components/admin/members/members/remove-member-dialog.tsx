import { ClubMember } from "@/interfaces/club";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRemoveMemberMutation } from "@/mutations/admin/member";
import { toast } from "sonner";
import { useContext } from "react";
import { Club, ClubContext } from "@/context/ClubContext";

interface RemoveMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: ClubMember | null;
    onRemoveSuccess?: () => void;
}

export default function RemoveMemberDialog({
    open,
    onOpenChange,
    member,
    onRemoveSuccess
}: RemoveMemberDialogProps) {
    const { club } = useContext(ClubContext) as { club: Club | null };
    const { mutate: removeMemberMutate, isPending: isRemoving } = useRemoveMemberMutation();

    const handleRemove = () => {
        if (club && member) {
            removeMemberMutate(
                { clubAccountId: club.club_account_id, memberId: member.user_id },
                {
                    onSuccess: () => {
                        toast.success("Member removed successfully");
                        onOpenChange(false);
                        onRemoveSuccess?.();
                    },
                    onError: (error: unknown) => {
                        const errObj = error as Record<string, unknown> | undefined;
                        const resp = errObj?.response as Record<string, unknown> | undefined;
                        const msg = (resp?.data as Record<string, unknown> | undefined)?.message as string | undefined ?? String(error ?? "An error occurred");
                        toast.error(msg);
                        onOpenChange(false);
                    }
                }
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>Remove Member</DialogTitle>
                    <DialogDescription>
                        <div>
                            <p>Are you sure you want to remove <span className="font-semibold">{member?.member_first_name} {member?.member_surname}</span>?</p>
                            <p className="mt-2 text-sm">This member will need to re-register if they wish to join again.</p>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleRemove}
                        disabled={isRemoving}
                    >
                        {isRemoving ? "Removing..." : "Remove"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
