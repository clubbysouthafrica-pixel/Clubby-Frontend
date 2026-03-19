import { ClubMember } from "@/interfaces/club";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRemoveRegistrationMutation } from "@/mutations/admin/useRegistrationMutation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";

interface RemoveRegistrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: ClubMember[];
    onRemoveSuccess?: (removedMembers: ClubMember[]) => void;
}

export default function RemoveRegistrationDialog({
    open,
    onOpenChange,
    members,
    onRemoveSuccess
}: RemoveRegistrationDialogProps) {
    const { mutate: removeRegistrationMutate, isPending: isRemoving } = useRemoveRegistrationMutation();
    const [confirmed, setConfirmed] = useState(false);
    const [displaySuccess, setDisplaySuccess] = useState(false);

    useEffect(() => {
        if (!open) {
            setConfirmed(false);
            setDisplaySuccess(false);
        }
    }, [open]);

    const handleRemove = () => {
        if (members.length > 0) {
            // Remove each registration one by one
            members.forEach((member) => {
                removeRegistrationMutate(
                    { 
                        user_id: member.user_id,
                        registration_id: member.registration_id || ""
                    },
                    {
                        onSuccess: () => {
                            // Check if this is the last member in the batch
                            const isLastMember = member.user_id === members[members.length - 1].user_id;
                            
                            if (isLastMember) {
                                if (members.length === 1) {
                                    toast.success("Registration removed successfully");
                                } else {
                                    toast.success(`${members.length} registrations removed successfully`);
                                }
                                setDisplaySuccess(true);
                                setTimeout(() => {
                                    onOpenChange(false);
                                    onRemoveSuccess?.(members);
                                }, 500);
                            }
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
            });
        }
    };



    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px] md:max-w-[768px]">
                <DialogHeader>
                    <DialogTitle>Remove {members.length > 1 ? "Registrations" : "Registration"}</DialogTitle>
                    <DialogDescription>
                        {members.length === 1 ? (
                            <p>Are you sure you want to remove the registration for <span className="font-semibold">{members[0]?.member_first_name} {members[0]?.member_surname}</span>?</p>
                        ) : (
                            <p>Remove <span className="font-semibold">{members.length} registrations</span>:</p>
                        )}
                    </DialogDescription>
                    <div className="rounded-lg border bg-white shadow-sm overflow-hidden mt-4">
                        <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-100 scrollable-list">
                            {members.map((member) => {
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
                        <li>{members.length > 1 ? "These registrations will" : "This registration will"} be permanently removed</li>
                        <li>All registration data associated with {members.length > 1 ? "these registrations" : "this registration"} will be archived</li>
                        <li>All reporting associated with {members.length > 1 ? "these registrations" : "this registration"} will also be removed</li>
                    </ul>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="remove-consent"
                        onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
                        disabled={displaySuccess}
                    />
                    <DialogDescription className="text-black">
                        I understand that this action will permanently remove {members.length > 1 ? "these registrations" : "this registration"}.
                    </DialogDescription>
                </div>

                {displaySuccess && (
                    <Alert>
                        <CheckCircle2Icon color="green" />
                        <AlertTitle className="text-green-800">Success!</AlertTitle>
                        <AlertDescription>Registration{members.length > 1 ? "s" : ""} removed successfully.</AlertDescription>
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
                        {isRemoving ? "Removing..." : displaySuccess ? "Removed" : "Remove Registration"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
