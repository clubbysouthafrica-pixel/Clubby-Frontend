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
import { User, Mail, Phone, MapPin, Calendar } from "lucide-react";
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
                className="!w-[80%] !h-[90%] !max-w-none !max-h-none p-5 gap-4 flex flex-col"
            >
                <DialogHeader className="flex justify-between">
                    <div className="flex items-end space-x-2">
                        <User className="w-10 h-10 text-gray-600" />
                        <DialogTitle className="text-lg font-semibold">
                            {`${selectedMember.member_first_name} ${selectedMember.member_surname}`}
                        </DialogTitle>
                    </div>
                </DialogHeader>
                
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-0">
                    <TabsList>
                        <TabsTrigger className="w-[180px]" value="user-information">User information</TabsTrigger>
                        <TabsTrigger className="w-[180px]" value="member-registration">Member registration</TabsTrigger>
                    </TabsList>

                    {selectedTab === "user-information" && (
                        <DialogDescription className="mt-2 mb-4">
                            This section contains information on the Clubby user.
                        </DialogDescription>
                    )}
                    {selectedTab === "member-registration" && (
                        <DialogDescription className="mt-2 ml-4">
                            This is the members current registration form.
                        </DialogDescription>
                    )}

                    <div className="overflow-hidden rounded-lg">
                        {selectedTab === "user-information" && isLoading && !memberUser &&
                            <div className="flex justify-center items-center p-5 min-h-[400px]">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        }
                        {selectedTab === "user-information" && !isLoading && memberUser &&
                            <Card className="border shadow-sm pt-0">
                                <CardHeader className="border-b bg-muted/30">
                                    <CardTitle className="text-l text-center pt-5">
                                        User Information
                                    </CardTitle>
                                    <CardDescription className="text-center">
                                        Personal details and contact information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="h-[400px] overflow-y-auto px-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {/* Email */}
                                            <div className="flex flex-col gap-1 p-2 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                                                </div>
                                                <Label className="text-base text-xs border-b-2 border-gray-300 pb-1">
                                                    {memberUser.email || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Phone Number */}
                                            <div className="flex flex-col gap-1 p-2 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-xs font-semibold text-muted-foreground">Phone Number</Label>
                                                </div>
                                                <Label className="text-base border-b-2 border-gray-300 pb-1">
                                                    {memberUser.phone_number || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Date of Birth */}
                                            <div className="flex flex-col gap-1 p-2 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-xs font-semibold text-muted-foreground">Date of Birth</Label>
                                                </div>
                                                <Label className="text-base border-b-2 border-gray-300 pb-1">
                                                    {memberUser.date_of_birth || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Address Line 1 */}
                                            <div className="flex flex-col gap-1 p-2 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-xs font-semibold text-muted-foreground">Address Line 1</Label>
                                                </div>
                                                <Label className="text-base border-b-2 border-gray-300 pb-1">
                                                    {memberUser.address_line_1 || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Address Line 2 */}
                                            <div className="flex flex-col gap-1 p-2 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-xs font-semibold text-muted-foreground">Address Line 2</Label>
                                                </div>
                                                <Label className="text-base border-b-2 border-gray-300 pb-1">
                                                    {memberUser.address_line_2 || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Suburb */}
                                            <div className="flex flex-col gap-1 p-2 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-xs font-semibold text-muted-foreground">Suburb</Label>
                                                </div>
                                                <Label className="text-base border-b-2 border-gray-300 pb-1">
                                                    {memberUser.suburb || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* City */}
                                            <div className="flex flex-col gap-1 p-2 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-xs font-semibold text-muted-foreground">City</Label>
                                                </div>
                                                <Label className="text-base border-b-2 border-gray-300 pb-1">
                                                    {memberUser.city || "Not provided"}
                                                </Label>
                                            </div>

                                            {/* Postal Code */}
                                            <div className="flex flex-col gap-1 p-2 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-xs font-semibold text-muted-foreground">Postal Code</Label>
                                                </div>
                                                <Label className="text-base border-b-2 border-gray-300 pb-1">
                                                    {memberUser.postal_code || "Not provided"}
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        }
                        {selectedTab === "member-registration" &&
                            <CurrentMemberRegistration clubName={clubName} userId={selectedMember.user_id} clubAccountId={clubAccountId} currency={currency} />
                        }
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog >
    );
}
