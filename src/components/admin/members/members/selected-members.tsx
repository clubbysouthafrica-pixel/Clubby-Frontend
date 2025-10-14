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
import { formatAmount } from "@/data/currencies";
import { Label } from "@/components/ui/label";

interface ImageProps {
    selectedMember: any;
    setSelectedMember: React.Dispatch<React.SetStateAction<any>>;
    currency: string;
    clubAccountId: string;
}

export default function SelectedMember({
    selectedMember,
    setSelectedMember,
    currency,
}: ImageProps) {
    const [selectedTab, setSelectedTab] = useState("club-information");
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
            <DialogContent
                className="overflow-y-auto p-5 gap-4"
            >
                <DialogHeader className="flex justify-between">
                    <div className="flex items-end space-x-2">
                        <User className="w-10 h-10 text-gray-600" />
                        <DialogTitle className="text-lg font-semibold">
                            {`${selectedMember.member_first_name} ${selectedMember.member_surname}`}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <Label className="my-2 text-lg m-0">Outstanding amount: <strong>{formatAmount(selectedMember.outstanding_amount, currency)}</strong> </Label>

                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-0">
                    <TabsList>
                        <TabsTrigger className="w-[150px]" value="club-information">Club information</TabsTrigger>
                        <TabsTrigger className="w-[150px]" value="club-fees">Club fees</TabsTrigger>
                        {/* <TabsTrigger className="w-[150px]" value="transactions">Transactions</TabsTrigger> */}
                    </TabsList>

                    {selectedTab === "club-information" && (
                        <DialogDescription className="mt-2 mb-4">
                            This section contains the standard fields completed by the member at the time of registration.
                        </DialogDescription>
                    )}
                    {selectedTab === "club-fees" && (
                        <DialogDescription className="mt-2 mb-4">
                            This section shows the club fees owed and paid by this member at the time of registration.
                        </DialogDescription>
                    )}
                    {selectedTab === "transactions" && (
                        <DialogDescription className="mt-2 mb-4">
                            This section shows transactions associated with this member and the club.
                        </DialogDescription>
                    )}

                    <div className="overflow-hidden rounded-lg border">
                        {(selectedTab === "club-information" || selectedTab === "club-fees") &&
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
                                    {selectedTab === "club-information" &&
                                        selectedMember.meta_standard.map((key: any) => (
                                            <TableRow key={key.field_name}>
                                                <TableCell className="text-center px-2 py-2">
                                                    {key.field_name}
                                                </TableCell>
                                                <TableCell className="text-center px-2 py-2">
                                                    {
                                                        key.value === "true" && key.type === "STANDARD_CHECKBOX" ? `✅`
                                                            : key.value === "true" && key.type === "STANDARD_CHECKBOX" ? `❌` : key.value
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {selectedTab === "club-fees" &&
                                        selectedMember.meta_billing.map((key: any) => (
                                            <TableRow key={key.field_name}>
                                                <TableCell className="text-center px-2 py-2">
                                                    {key.field_name}
                                                </TableCell>
                                                {key.type === "BILLING_DROPDOWN" ? (
                                                    <TableCell className="text-center px-2 py-2">
                                                        {key.label_value} ({formatAmount(key.value, currency)})
                                                    </TableCell>
                                                ) : (
                                                    <TableCell className="text-center px-2 py-2">
                                                        {formatAmount(key.value, currency)}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        }
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
