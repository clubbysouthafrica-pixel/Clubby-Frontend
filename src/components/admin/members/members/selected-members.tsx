import React, { useState } from "react";
import {
    Dialog,
    DialogTrigger,
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
import { formatAmount } from "@/data/currencies";
import { Label } from "@/components/ui/label";

interface ImageProps {
    selectedMember: any;
    setSelectedMember: React.Dispatch<React.SetStateAction<any>>;
    currency: string;
}

export default function SelectedMemberDialog({
    selectedMember,
    setSelectedMember,
    currency,
}: ImageProps) {
    const [selectedTab, setSelectedTab] = useState("registered-members");
    const [open, setOpen] = useState(false);

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
            <DialogTrigger asChild>
                <></>
            </DialogTrigger>

            <DialogContent className="max-w-4xl w-full p-6">
                <DialogHeader className="flex justify-between">
                    <div className="flex items-end space-x-2">
                        <User className="w-10 h-10 text-gray-600" />
                        <DialogTitle className="text-lg font-semibold">
                            {`${selectedMember.member_first_name} ${selectedMember.member_surname}`}
                        </DialogTitle>
                    </div>
                </DialogHeader>
                <Label className="my-2 m-0">Outstanding amount: {formatAmount(selectedMember.outstanding_amount, currency)}</Label>

                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-0">
                    <TabsList>
                        <TabsTrigger value="registered-members">Club information</TabsTrigger>
                        <TabsTrigger value="pending-members">Club fees</TabsTrigger>
                    </TabsList>

                    {selectedTab === "registered-members" && (
                        <DialogDescription className="mt-2 mb-4">
                            This section contains the standard fields completed by the member at the time of registration.
                        </DialogDescription>
                    )}
                    {selectedTab === "pending-members" && (
                        <DialogDescription className="mt-2 mb-4">
                            This section shows the club fees owed and paid by this member at the time of registration.
                        </DialogDescription>
                    )}

                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="align-middle px-2 py-2 w-1/2">
                                        Field
                                    </TableHead>
                                    <TableHead className="align-middle px-2 py-2 w-1/2">
                                        Value
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedTab === "registered-members" &&
                                    selectedMember.meta_standard.map((key: any) => (
                                        <TableRow key={key.field_name}>
                                            <TableCell className="align-middle px-2 py-2">
                                                {key.field_name}
                                            </TableCell>
                                            <TableCell className="align-middle px-2 py-2">
                                                {
                                                    key.value === "true" && key.type === "STANDARD_CHECKBOX" ? `✅`
                                                        : key.value === "true" && key.type === "STANDARD_CHECKBOX" ? `❌` : key.value
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                {selectedTab === "pending-members" &&
                                    selectedMember.meta_billing.map((key: any) => (
                                        <TableRow key={key.field_name}>
                                            <TableCell className="align-middle px-2 py-2">
                                                {key.field_name}
                                            </TableCell>
                                            {key.type === "BILLING_DROPDOWN" ? (
                                                <TableCell className="align-middle px-2 py-2">
                                                    {key.label_value} ({formatAmount(key.value, currency)})
                                                </TableCell>
                                            ) : (
                                                <TableCell className="align-middle px-2 py-2">
                                                    {formatAmount(key.value, currency)}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>

                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
