import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { User, AlertTriangle } from "lucide-react";
import { CurrentMemberRegistration } from "./current_member_registration";

interface RegistrationDialogProps {
    selectedMember: any;
    setSelectedMember: React.Dispatch<React.SetStateAction<any>>;
    currency: string;
    clubAccountId: string;
    clubName: string;
}

export default function RegistrationDialog({
    selectedMember,
    setSelectedMember,
    clubName,
    clubAccountId,
    currency,
}: RegistrationDialogProps) {
    const [open, setOpen] = useState(false);
    const isMissingMember = selectedMember?.missing_club_member === true;

    React.useEffect(() => {
        if (selectedMember) setOpen(true);
        else setOpen(false);
    }, [selectedMember]);

    if (!selectedMember) return null;

    return (
        <Dialog
            open={open}
            onOpenChange={(openState) => {
                setOpen(openState);
                if (!openState) {
                    setSelectedMember(null);
                    window.history.pushState("", document.title, window.location.pathname + window.location.search);
                }
            }}
        >
            <DialogContent
                className="!w-[60%] !h-[90%] !max-w-none !max-h-none p-5 gap-4 flex flex-col min-h-0"
            >
                <DialogHeader className="flex justify-between">
                    <div className="flex items-end space-x-2">
                        <User className="w-10 h-10 text-gray-600" />
                        <DialogTitle className="text-lg font-semibold">
                            {`${selectedMember.member_first_name} ${selectedMember.member_surname}`}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                {isMissingMember && (
                    <div className="bg-red-50 border-l-4 border-red-600 p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-red-800 text-sm">Member No Longer Active</p>
                            <p className="text-red-700 text-xs mt-1">This member is no longer part of the club and won't appear in the members table.</p>
                        </div>
                    </div>
                )}

                <CurrentMemberRegistration
                    clubName={clubName}
                    userId={selectedMember.user_id}
                    clubAccountId={clubAccountId}
                    currency={currency}
                    missingMember={isMissingMember}
                    registrationId={selectedMember.registration_id}
                />
            </DialogContent>
        </Dialog>
    );
}
