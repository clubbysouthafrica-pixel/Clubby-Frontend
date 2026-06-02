import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { User, Mail, Phone, MapPin, Calendar, Copy } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useFetchMemberUser } from "@/queries/admin/member_user";
import { Loader2 } from "lucide-react";
import { ClubMember } from "@/interfaces/club";
import { Badge } from "@/components/ui/badge";

type SelectedMemberWithStatus = ClubMember & {
    registered?: boolean;
    non_registration?: boolean;
};

const getMemberStatusBadge = (member: SelectedMemberWithStatus) => {
    if (member.non_registration) {
        return {
            label: "Non Registration",
            className: "bg-sky-100 text-sky-800 border-sky-300",
        };
    }

    if (member.deregistered_on || (member.registered === false && member.resubmission_required)) {
        return {
            label: "Deregistered",
            className: "bg-red-100 text-red-800 border-red-300",
        };
    }

    if (member.registered === true || member.registered_on) {
        return {
            label: "Registered",
            className: "bg-green-100 text-green-800 border-green-300",
        };
    }

    if (member.registration_submitted_on || member.registered === false) {
        return {
            label: "Pending",
            className: "bg-orange-100 text-orange-800 border-orange-300",
        };
    }

    return {
        label: "Member",
        className: "bg-slate-100 text-slate-800 border-slate-300",
    };
};

interface SelectedMemberDialogProps {
    selectedMember: ClubMember | null;
}

export default function SelectedMemberDialog({
    selectedMember,
}: SelectedMemberDialogProps) {
    const userId = selectedMember?.user_id ?? "";
    const { data: memberUser, isLoading } = useFetchMemberUser(userId);

    if (!selectedMember) return null;

    const memberStatus = getMemberStatusBadge(selectedMember as SelectedMemberWithStatus);

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
            <Card className="overflow-hidden border border-slate-200/70 bg-white/95 shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
                <CardHeader className="border-b border-slate-200 bg-slate-50/80">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                            <User className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-xl text-slate-950">
                                {`${selectedMember.member_first_name} ${selectedMember.member_surname}`}
                            </CardTitle>
                            <CardDescription className="mt-1 text-sm leading-6 text-slate-500">
                                This section contains information on the selected club member.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Member ID
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <strong className="text-sm font-mono text-slate-900">
                                {selectedMember.user_id || "Not provided"}
                            </strong>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedMember.user_id || "");
                                }}
                                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                title="Copy Member ID"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Name</p>
                            <p className="mt-2 text-base font-semibold text-slate-900">
                                {selectedMember.member_first_name} {selectedMember.member_surname}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Email</p>
                            <p className="mt-2 break-words text-sm font-medium text-slate-900">
                                {selectedMember.member_email || "Not provided"}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2 lg:col-span-1">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Status</p>
                            <div className="mt-2">
                                <Badge className={memberStatus.className}>
                                    {memberStatus.label}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading user information...
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            <Card className="overflow-hidden border border-slate-200/70 bg-white/95 shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
                <CardHeader className="border-b border-slate-200 bg-slate-50/80">
                    <CardTitle className="text-xl text-slate-950">
                        User Information
                    </CardTitle>
                    <CardDescription>
                        Personal details and contact information.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                    {!isLoading && memberUser ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-sm font-semibold text-muted-foreground">Email</Label>
                                </div>
                                <Label className="border-b-2 border-gray-300 pb-1 text-sm text-base">
                                    {memberUser.email || "Not provided"}
                                </Label>
                            </div>

                            <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-sm font-semibold text-muted-foreground">Phone Number</Label>
                                </div>
                                <Label className="border-b-2 border-gray-300 pb-1 text-sm text-base">
                                    {memberUser.phone_number || "Not provided"}
                                </Label>
                            </div>

                            <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-sm font-semibold text-muted-foreground">Date of Birth</Label>
                                </div>
                                <Label className="border-b-2 border-gray-300 pb-1 text-sm text-base">
                                    {memberUser.date_of_birth || "Not provided"}
                                </Label>
                            </div>

                            <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-sm font-semibold text-muted-foreground">Address Line 1</Label>
                                </div>
                                <Label className="border-b-2 border-gray-300 pb-1 text-sm text-base">
                                    {memberUser.address_line_1 || "Not provided"}
                                </Label>
                            </div>

                            <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-sm font-semibold text-muted-foreground">Address Line 2</Label>
                                </div>
                                <Label className="border-b-2 border-gray-300 pb-1 text-sm text-base">
                                    {memberUser.address_line_2 || "Not provided"}
                                </Label>
                            </div>

                            <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-sm font-semibold text-muted-foreground">Suburb</Label>
                                </div>
                                <Label className="border-b-2 border-gray-300 pb-1 text-sm text-base">
                                    {memberUser.suburb || "Not provided"}
                                </Label>
                            </div>

                            <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-sm font-semibold text-muted-foreground">City</Label>
                                </div>
                                <Label className="border-b-2 border-gray-300 pb-1 text-sm text-base">
                                    {memberUser.city || "Not provided"}
                                </Label>
                            </div>

                            <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-sm font-semibold text-muted-foreground">Postal Code</Label>
                                </div>
                                <Label className="border-b-2 border-gray-300 pb-1 text-sm text-base">
                                    {memberUser.postal_code || "Not provided"}
                                </Label>
                            </div>
                        </div>
                    ) : !isLoading ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                            No additional user information is available for this member.
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
