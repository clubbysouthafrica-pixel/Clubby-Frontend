import { ClubMember } from "@/interfaces/club";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRemoveMemberMutation } from "@/mutations/admin/member";
import { toast } from "sonner";
import { useContext, useState } from "react";
import { Club, ClubContext } from "@/context/ClubContext";
import { Checkbox } from "@/components/ui/checkbox";

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
    const [confirmed, setConfirmed] = useState(false);

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
                            <p className="mt-4 text-sm font-semibold text-black">This member will be permanently removed from the club. They will need to submit a brand new registration to re-join the club.</p>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="remove-consent"
                        onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
                    />
                    <DialogDescription className="text-black">
                        I understand that this action will permanently remove the member from the club.
                    </DialogDescription>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleRemove}
                        disabled={isRemoving || !confirmed}
                        variant="destructive"
                    >
                        {isRemoving ? "Removing..." : "Remove"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
