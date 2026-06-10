import { ClubMember } from "@/interfaces/club";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRemoveMemberMutation } from "@/mutations/admin/member";
import { toast } from "sonner";
import { useContext, useState, useEffect } from "react";
import { Club, ClubContext } from "@/context/ClubContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";

interface RemoveMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: ClubMember[];
    onRemoveSuccess?: (memberIds: string[]) => void;
}

export default function RemoveMemberDialog({
    open,
    onOpenChange,
    members,
    onRemoveSuccess
}: RemoveMemberDialogProps) {
    const { club } = useContext(ClubContext) as { club: Club | null };
    const { mutate: removeMemberMutate, isPending: isRemoving } = useRemoveMemberMutation();
    const [confirmed, setConfirmed] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [displaySuccess, setDisplaySuccess] = useState(false);

    useEffect(() => {
        if (!open) {
            setConfirmed(false);
            setSearchQuery("");
            setDisplaySuccess(false);
        }
    }, [open]);

    const handleRemove = () => {
        if (club && members.length > 0) {
            const memberIds = members.map((member) => member.user_id);
            removeMemberMutate(
                { clubAccountId: club.club_account_id, memberIds: memberIds },
                {
                    onSuccess: () => {
                        if (members.length === 1) {
                            toast.success("Member removed successfully");
                        } else {
                            toast.success(`${members.length} members removed successfully`);
                        }
                        setDisplaySuccess(true);
                        setTimeout(() => {
                            onOpenChange(false);
                            onRemoveSuccess?.(memberIds);
                        }, 500);
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

    const filteredMembers = members.filter((member) =>
        `${member.member_first_name} ${member.member_surname}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] overflow-y-auto rounded-[24px] p-3 sm:max-w-[640px] sm:p-6 md:max-w-[768px]">
                <DialogHeader>
                    <DialogTitle>Remove {members.length > 1 ? "Members" : "Member"}</DialogTitle>
                    <DialogDescription>
                        {members.length === 1 ? (
                            <p>Are you sure you want to remove <span className="font-semibold">{members[0]?.member_first_name} {members[0]?.member_surname}</span>?</p>
                        ) : (
                            <p>Remove <span className="font-semibold">{members.length} members</span>:</p>
                        )}
                    </DialogDescription>
                    <div className="mt-3 overflow-hidden rounded-lg border bg-white shadow-sm sm:mt-4">
                        <div className="p-2">
                            <Input
                                placeholder="Search members"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="mb-1.5 h-8 text-xs sm:mb-2"
                            />
                        </div>
                        <div className="max-h-[180px] overflow-y-auto divide-y divide-gray-100 scrollable-list sm:max-h-[200px]">
                            {filteredMembers.map((member) => {
                                const initials = `${member.member_first_name} ${member.member_surname}`
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()
                                return (
                                    <div
                                        key={member.user_id}
                                        className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 sm:gap-3 sm:px-3"
                                    >
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow-sm sm:h-8 sm:w-8 sm:text-sm">
                                            {initials}
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate font-medium text-xs sm:text-sm">{member.member_first_name} {member.member_surname}</span>
                                        </div>
                                        <div className="ml-auto">
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 sm:px-2 sm:text-xs">
                                                To Remove
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-3 space-y-1.5 rounded-lg border border-red-200 bg-red-50 p-2.5 sm:mt-4 sm:space-y-2 sm:p-3">
                    <p className="text-sm font-semibold text-red-900">What happens next:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs text-red-800 sm:text-sm">
                        <li>{members.length > 1 ? "These members will" : "This member will"} be permanently removed from the club</li>
                        <li>{members.length > 1 ? "They will" : "They will"} need to submit a brand new registration to re-join the club</li>
                        <li>All registration data associated with {members.length > 1 ? "these members" : "this member"} will be removed</li>
                    </ul>
                </div>

                <div className="flex items-start gap-2 sm:items-center">
                    <Checkbox
                        id="remove-consent"
                        onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
                        disabled={displaySuccess}
                        className="mt-0.5 sm:mt-0"
                    />
                    <DialogDescription className="text-xs leading-4 text-black sm:text-sm sm:leading-5">
                        I understand that this action will permanently remove {members.length > 1 ? "these members" : "the member"} from the club.
                    </DialogDescription>
                </div>

                {displaySuccess && (
                    <Alert>
                        <CheckCircle2Icon color="green" />
                        <AlertTitle className="text-green-800">Success!</AlertTitle>
                        <AlertDescription>Member{members.length > 1 ? "s" : ""} removed successfully.</AlertDescription>
                    </Alert>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                        <Button variant="outline" className="h-8 w-full text-xs sm:h-10 sm:w-auto sm:text-sm">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleRemove}
                        disabled={isRemoving || !confirmed || displaySuccess}
                        variant="destructive"
                        className="h-8 w-full text-xs sm:h-10 sm:w-auto sm:text-sm"
                    >
                        {isRemoving ? "Removing..." : displaySuccess ? "Removed" : "Remove"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
