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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { User } from "lucide-react";
// import { formatAmount } from "@/data/currencies";
// import { Label } from "@/components/ui/label";
import { CurrentMemberRegistration } from "./current_member_registration"
import { useFetchMemberUser } from "@/queries/admin/member_user";
import { Loader2 } from "lucide-react";

interface ImageProps {
    selectedMember: any;
    setSelectedMember: React.Dispatch<React.SetStateAction<any>>;
    currency: string;
    clubAccountId: string;
}

interface MemberUser { phone_number: string; date_of_birth: string; email: string; address_line_1: string; address_line_2: string; suburb: string; city: string; postal_code: string; }

const MEMBER_USER_MAPPING = {
    "phone_number": "Phone Number",
    "date_of_birth": "Date of Birth",
    "email": "Email",
    "address_line_1": "Address Line 1",
    "address_line_2": "Address Line 2",
    "suburb": "Suburb",
    "city": "City",
    "postal_code": "Postal Code"
}

export default function SelectedMember({
    selectedMember,
    setSelectedMember,
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

                {/* <Label className="my-2 text-lg m-0">Outstanding amount: <strong>{formatAmount(selectedMember.outstanding_amount, currency)}</strong> </Label> */}

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
                        <DialogDescription className="mt-2 mb-4">
                            This is the members current registration form.
                        </DialogDescription>
                    )}

                    <div className="overflow-hidden rounded-lg border">
                        {selectedTab === "user-information" && isLoading && !memberUser &&
                            <div className="p-5 min-h-screen">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        }
                        {selectedTab === "user-information" && !isLoading && memberUser &&
                            <Table>
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="text-center px-2 py-2 w-1/2">
                                            Field
                                        </TableHead>
                                        <TableHead className="text-center px-2 py-2 w-1/2">
                                            Value
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {
                                        Object.keys(memberUser as MemberUser).map((key) => {
                                            const typedKey = key as keyof MemberUser; // <-- type assertion
                                            return (
                                                <TableRow key={typedKey}>
                                                    <TableCell className="text-center px-2 py-2">
                                                        {MEMBER_USER_MAPPING[typedKey]}
                                                    </TableCell>
                                                    <TableCell className="text-center px-2 py-2">
                                                        {memberUser[typedKey]}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    }
                                </TableBody>
                            </Table>
                        }
                        {selectedTab === "member-registration" &&
                            <CurrentMemberRegistration userId={selectedMember.user_id} clubAccountId={clubAccountId} currency={currency} />
                        }
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog >
    );
}
