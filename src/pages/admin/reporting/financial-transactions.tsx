import { useContext, useMemo, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClubTransactions } from "@/queries/admin/transactions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatAmount } from "@/data/currencies";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function FinancialTransactionsPage() {
    const { club } = useContext(ClubContext) as ClubContextType;
    const { data: transactions, isLoading } = useFetchClubTransactions(club?.club_account_id as string);

    const [searchTerm, setSearchTerm] = useState("");
    const [paymentType, setPaymentType] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredTransactions = useMemo(() => {
        if (!transactions?.transactions) return [];

        return transactions.transactions.filter((txn: any) => {
            const matchesName = txn.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = paymentType === "all" ? true : txn.payment_type === paymentType;
            const matchesStatus = statusFilter === "all" ? true : txn.status === statusFilter;
            return matchesName && matchesType && matchesStatus;
        });
    }, [transactions, searchTerm, paymentType, statusFilter]);

    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold mb-4">Financial Transactions</h1>

            <div className="flex flex-wrap gap-4 mb-6">
                <Input
                    className="w-[20%]"
                    placeholder="Search by member name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <Select onValueChange={setPaymentType} value={paymentType}>
                    <SelectTrigger className="flex items-center gap-2 w-[20%]">
                        <span className="text-muted-foreground whitespace-nowrap">Payment type:</span>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="EFT/CASH">EFT or Cash</SelectItem>
                    </SelectContent>
                </Select>

                <Select onValueChange={setStatusFilter} value={statusFilter}>
                    <SelectTrigger className="flex items-center gap-2 w-[20%]">
                        <span className="text-muted-foreground whitespace-nowrap">Status:</span>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    </SelectContent>
                </Select>
            </div>



            {/* Table */}
            <div className="overflow-hidden rounded-lg border">
                {isLoading ? (
                    <div className="p-4 text-center">
                        <Label>Loading...</Label>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="text-center w-1/6">Transaction ID</TableHead>
                                <TableHead className="text-center w-1/6">Member name</TableHead>
                                <TableHead className="text-center w-1/6">Date</TableHead>
                                <TableHead className="text-center w-1/6">Payment type</TableHead>
                                <TableHead className="text-center w-1/6">Amount</TableHead>
                                <TableHead className="text-center w-1/6">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((key: any) => (
                                    <TableRow key={key.transaction_id}>
                                        <TableCell className="text-center w-1/6">
                                            <div
                                                className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted hover:bg-muted/70 cursor-pointer text-sm transition"
                                                onClick={() =>
                                                    navigator.clipboard.writeText(key.transaction_id)
                                                }
                                                title="Click to copy full Transaction ID"
                                            >
                                                <span className="font-mono">{key.transaction_id.slice(0, 5)}...</span>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 text-muted-foreground hover:text-foreground transition"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 16h8m2 0a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2zM8 16v2a2 2 0 002 2h8a2 2 0 002-2v-2"
                                                    />
                                                </svg>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center w-1/6">{key.name}</TableCell>
                                        <TableCell className="text-center w-1/6">{key.date}</TableCell>
                                        <TableCell className="text-center w-1/6">{key.payment_type}</TableCell>
                                        <TableCell className="text-center w-1/6">
                                            {formatAmount(key.amount, club?.currency)}
                                        </TableCell>
                                        <TableCell
                                            className={`text-center font-bold w-1/6 ${key.status === "PENDING" ? "text-red-500" : "text-green-500"
                                                }`}
                                        >
                                            {key.status}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
