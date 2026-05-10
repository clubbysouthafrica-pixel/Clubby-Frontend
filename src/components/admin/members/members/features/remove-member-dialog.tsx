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
            <DialogContent className="sm:max-w-[640px] md:max-w-[768px]">
                <DialogHeader>
                    <DialogTitle>Remove {members.length > 1 ? "Members" : "Member"}</DialogTitle>
                    <DialogDescription>
                        {members.length === 1 ? (
                            <p>Are you sure you want to remove <span className="font-semibold">{members[0]?.member_first_name} {members[0]?.member_surname}</span>?</p>
                        ) : (
                            <p>Remove <span className="font-semibold">{members.length} members</span>:</p>
                        )}
                    </DialogDescription>
                    <div className="rounded-lg border bg-white shadow-sm overflow-hidden mt-4">
                        <div className="p-2">
                            <Input
                                placeholder="Search members"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="mb-2"
                            />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-100 scrollable-list">
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
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm shadow-sm">
                                            {initials}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{member.member_first_name} {member.member_surname}</span>
                                        </div>
                                        <div className="ml-auto">
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600 font-medium">
                                                To Remove
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-4 space-y-2 bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-sm font-semibold text-red-900">What happens next:</p>
                    <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                        <li>{members.length > 1 ? "These members will" : "This member will"} be permanently removed from the club</li>
                        <li>{members.length > 1 ? "They will" : "They will"} need to submit a brand new registration to re-join the club</li>
                        <li>All registration data associated with {members.length > 1 ? "these members" : "this member"} will be removed</li>
                    </ul>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="remove-consent"
                        onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
                        disabled={displaySuccess}
                    />
                    <DialogDescription className="text-black">
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

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleRemove}
                        disabled={isRemoving || !confirmed || displaySuccess}
                        variant="destructive"
                    >
                        {isRemoving ? "Removing..." : displaySuccess ? "Removed" : "Remove"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
