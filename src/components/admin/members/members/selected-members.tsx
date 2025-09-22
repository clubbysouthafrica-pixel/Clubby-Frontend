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
import { useFetchMemberTransactions } from "@/queries/admin/transactions";

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
    clubAccountId,
}: ImageProps) {
    const [selectedTab, setSelectedTab] = useState("registered-members");
    const [open, setOpen] = useState(false);

    const { data: transactions, isLoading } = useFetchMemberTransactions(clubAccountId, selectedMember?.user_id);

    React.useEffect(() => {
        if (selectedMember) setOpen(true);
        else setOpen(false);
    }, [selectedMember]);
    if (!selectedMember) return null;

    console.log(transactions)

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
                        <TabsTrigger className="w-[150px]" value="registered-members">Club information</TabsTrigger>
                        <TabsTrigger className="w-[150px]" value="pending-members">Club fees</TabsTrigger>
                        <TabsTrigger className="w-[150px]" value="transactions">Transactions</TabsTrigger>
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
                    {selectedTab === "transactions" && (
                        <DialogDescription className="mt-2 mb-4">
                            This section shows transactions associated with this member and the club.
                        </DialogDescription>
                    )}

                    <div className="overflow-hidden rounded-lg border">
                        {selectedTab === "registered-members" || selectedTab === "pending-members" &&
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
                                    {selectedTab === "registered-members" &&
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
                                    {selectedTab === "pending-members" &&
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
                        {selectedTab === "transactions" &&
                            <Table>
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="text-center w-1/4">
                                            Date
                                        </TableHead>
                                        <TableHead className="text-center w-1/4">
                                            Payment type
                                        </TableHead>
                                        <TableHead className="text-center w-1/4">
                                            Amount
                                        </TableHead>
                                        <TableHead className="text-center w-1/4">
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {
                                        transactions.transactions.map((key: any) => (
                                            <TableRow key={key.transaction_id}>
                                                <TableCell className="text-center w-1/4">
                                                    {key.date}
                                                </TableCell>
                                                <TableCell className="text-center w-1/4">
                                                    {key.payment_type}
                                                </TableCell>
                                                <TableCell className="text-center w-1/4">
                                                    {formatAmount(key.amount, currency)}
                                                </TableCell>
                                                <TableCell className={`text-center font-bold w-1/4 ${key.status === "PENDING" ? "text-red-500" : "text-green-500"}`}>
                                                    {key.status}
                                                </TableCell>
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
