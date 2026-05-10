import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ClubMember } from "@/interfaces/club";
import { ArrowLeft, User, AlertTriangle } from "lucide-react";
import { CurrentMemberRegistration } from "./current_member_registration";

interface RegistrationDialogProps {
    selectedMember: ClubMember;
    currency: string;
    clubAccountId: string;
    clubName: string;
    onReviewPendingRegistration?: (member: ClubMember) => void;
    onBack: () => void;
}

export default function RegistrationDialog({
    selectedMember,
    clubName,
    clubAccountId,
    currency,
    onReviewPendingRegistration,
    onBack,
}: RegistrationDialogProps) {
    const isMissingMember = selectedMember?.missing_club_member === true;
    const isPendingRegistration = Boolean(
        selectedMember?.registration_submitted_on &&
        !selectedMember?.registered_on &&
        !selectedMember?.deregistered_on,
    );

    if (!selectedMember?.user_id) return null;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Button type="button" variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go back to registrations
                </Button>
            </div>

            <Card className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
                <CardHeader className="border-b border-slate-200 bg-slate-50/70">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-end gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-slate-950">
                                    {`${selectedMember.member_first_name} ${selectedMember.member_surname}`}
                                </CardTitle>
                                <CardDescription className="mt-1 text-sm text-slate-500">
                                    Review the submitted registration details, billing information, and captured form responses.
                                </CardDescription>
                            </div>
                        </div>
                        {isPendingRegistration && onReviewPendingRegistration ? (
                            <Button
                                type="button"
                                onClick={() => onReviewPendingRegistration(selectedMember)}
                            >
                                Register Member
                            </Button>
                        ) : null}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4 md:p-5">
                    {isMissingMember && (
                        <div className="flex items-start gap-3 rounded-[18px] border border-red-200 bg-red-50 p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-800">Member No Longer Active</p>
                                <p className="mt-1 text-xs text-red-700">This member is no longer part of the club and will not appear in the active members table.</p>
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
                </CardContent>
            </Card>
        </div>
    );
}
