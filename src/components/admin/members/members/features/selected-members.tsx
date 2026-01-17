import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { User, Mail, Phone, MapPin, Calendar, Copy } from "lucide-react";
import { Label } from "@/components/ui/label";
import { CurrentMemberRegistration } from "./current_member_registration"
import { useFetchMemberUser } from "@/queries/admin/member_user";
import { Loader2 } from "lucide-react";

interface ImageProps {
    selectedMember: any;
    setSelectedMember: React.Dispatch<React.SetStateAction<any>>;
    currency: string;
    clubAccountId: string;
    clubName: string;
}

export default function SelectedMember({
    selectedMember,
    setSelectedMember,
    clubName,
    clubAccountId,
    currency,
}: ImageProps) {
    const [selectedTab, setSelectedTab] = useState("user-information");
    const [open, setOpen] = useState(false);

    const userId = selectedMember?.user_id ?? "";
    const { data: memberUser, isLoading } = useFetchMemberUser(userId);

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
                
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-0 flex-1 min-h-0 flex flex-col">
                    <TabsList>
                        <TabsTrigger className="w-[180px]" value="user-information">User information</TabsTrigger>
                        <TabsTrigger className="w-[180px]" value="member-registration">Member registration</TabsTrigger>
                    </TabsList>

                    {selectedTab === "user-information" && (
                        <DialogDescription className="my-2">
                            This section contains information on the Clubby user.
                        </DialogDescription>
                    )}

                    {selectedTab === "member-registration" && (
                        <DialogDescription className="mt-2 mb-2">
                            This section contains information on the member registration.
                        </DialogDescription>
                    )}

                    <div className="flex-1 min-h-0 overflow-hidden rounded-lg flex flex-col">
                        {selectedTab === "user-information" && isLoading && !memberUser &&
                            <div className="flex justify-center items-center p-5 min-h-[400px]">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        }
                        {selectedTab === "user-information" && (
                            <div className="flex flex-col gap-0 flex-1 min-h-0">
                                {/* Member ID Section - Always visible */}
                                <div className="flex items-center gap-2 text-sm bg-transparent p-1">
                                    <span className="text-muted-foreground text-xs">Member ID:</span>
                                    <strong className="text-xs font-mono">{selectedMember.user_id || "Not provided"}</strong>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedMember.user_id || "");
                                        }}
                                        className="p-1 hover:bg-muted rounded transition-colors"
                                        title="Copy Member ID"
                                    >
                                        <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
                                    </button>
                                </div>

                                {/* User Information Section - Shows when loaded */}
                                {!isLoading && memberUser && (
                                    <Card className="border shadow-sm pt-0 flex-1 min-h-0 flex flex-col">
                                        <CardHeader className="border-b bg-muted/30">
                                            <CardTitle className="text-l text-center pt-5">
                                                User Information
                                            </CardTitle>
                                            <CardDescription className="text-center">
                                                Personal details and contact information
                                            </CardDescription>
                                        </CardHeader>
                                <CardContent className="p-4 flex-1 min-h-0 overflow-y-auto">
                                    <div className="px-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Email */}
                                            <div className="flex flex-col gap-2 p-4 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-sm font-semibold text-muted-foreground">Email</Label>
                                                </div>
                                                <Label className="text-base text-sm border-b-2 border-gray-300 pb-1">
                                                    {memberUser.email || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Phone Number */}
                                            <div className="flex flex-col gap-2 p-4 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-sm font-semibold text-muted-foreground">Phone Number</Label>
                                                </div>
                                                <Label className="text-base text-sm border-b-2 border-gray-300 pb-1">
                                                    {memberUser.phone_number || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Date of Birth */}
                                            <div className="flex flex-col gap-2 p-4 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-sm font-semibold text-muted-foreground">Date of Birth</Label>
                                                </div>
                                                <Label className="text-base text-sm border-b-2 border-gray-300 pb-1">
                                                    {memberUser.date_of_birth || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Address Line 1 */}
                                            <div className="flex flex-col gap-2 p-4 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-sm font-semibold text-muted-foreground">Address Line 1</Label>
                                                </div>
                                                <Label className="text-base text-sm border-b-2 border-gray-300 pb-1">
                                                    {memberUser.address_line_1 || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Address Line 2 */}
                                            <div className="flex flex-col gap-2 p-4 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-sm font-semibold text-muted-foreground">Address Line 2</Label>
                                                </div>
                                                <Label className="text-base text-sm border-b-2 border-gray-300 pb-1">
                                                    {memberUser.address_line_2 || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Suburb */}
                                            <div className="flex flex-col gap-2 p-4 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-sm font-semibold text-muted-foreground">Suburb</Label>
                                                </div>
                                                <Label className="text-base text-sm border-b-2 border-gray-300 pb-1">
                                                    {memberUser.suburb || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* City */}
                                            <div className="flex flex-col gap-1 p-4 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-sm font-semibold text-muted-foreground">City</Label>
                                                </div>
                                                <Label className="text-base text-sm border-b-2 border-gray-300 pb-1">
                                                    {memberUser.city || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Postal Code */}
                                            <div className="flex flex-col gap-1 p-4 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-sm font-semibold text-muted-foreground">Postal Code</Label>
                                                </div>
                                                <Label className="text-base text-sm border-b-2 border-gray-300 pb-1">
                                                    {memberUser.postal_code || "Not provided"}
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                        {selectedTab === "member-registration" &&
                            <CurrentMemberRegistration clubName={clubName} userId={selectedMember.user_id} clubAccountId={clubAccountId} currency={currency} />
                        }
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog >
    );
}
