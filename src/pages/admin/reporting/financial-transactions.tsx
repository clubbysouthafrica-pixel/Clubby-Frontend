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
import * as React from "react";

export default function FinancialTransactionsPage() {
    const { club } = useContext(ClubContext) as ClubContextType;
    const { data: transactions, isLoading } = useFetchClubTransactions(club?.club_account_id as string);

    const [searchTerm, setSearchTerm] = useState("");
    const [paymentType, setPaymentType] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [transactionType, setTransactionType] = useState("all");

    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const filteredTransactions = useMemo(() => {
        if (!transactions?.transactions) return [];

        return transactions.transactions.filter((txn: any) => {
            const matchesName = txn.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPaymentType = paymentType === "all" ? true : txn.payment_type === paymentType;
            const matchesStatus = statusFilter === "all" ? true : txn.status === statusFilter;
            const matchesType = transactionType === "all" ? true : txn.type === transactionType;
            return matchesName && matchesPaymentType && matchesStatus && matchesType;
        });
    }, [transactions, searchTerm, paymentType, statusFilter, transactionType]);

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

                <Select onValueChange={setTransactionType} value={transactionType}>
                    <SelectTrigger className="flex items-center gap-2 w-[20%]">
                        <span className="text-muted-foreground whitespace-nowrap">Transaction Type:</span>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="REGISTRATION">Registration</SelectItem>
                    </SelectContent>
                </Select>

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
                        <SelectItem value="PARTIALLY PAID">Partially paid</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
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
                                <TableHead className="text-center w-1/8">Transaction ID</TableHead>
                                <TableHead className="text-center w-1/8">Creation date</TableHead>
                                <TableHead className="text-center w-1/8">Type</TableHead>
                                <TableHead className="text-center w-1/8">Member name</TableHead>
                                <TableHead className="text-center w-1/8">Payment type</TableHead>
                                <TableHead className="text-center w-1/8">Amount Paid</TableHead>
                                <TableHead className="text-center w-1/8">Amount Owing</TableHead>
                                <TableHead className="text-center w-1/8">Status</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredTransactions.map((tx: any) => (
                                <React.Fragment key={tx.transaction_id}>
                                    {/* Main Transaction Row */}
                                    <TableRow
                                        className="cursor-pointer hover:bg-muted/50 transition"
                                        onClick={() => toggleRow(tx.transaction_id)}
                                    >
                                        <TableCell className="text-center w-1/8">
                                            <div className="inline-flex items-center gap-2 justify-center">
                                                <span className="font-mono">{tx.transaction_id.slice(0, 5)}...</span>

                                                {/* Copy button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent triggering row expand
                                                        navigator.clipboard.writeText(tx.transaction_id);
                                                    }}
                                                    title="Click to copy full Transaction ID"
                                                    className="hover:text-primary"
                                                >
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
                                                </button>

                                                {/* Expand icon */}
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className={`h-4 w-4 transition-transform ${expandedRows[tx.transaction_id] ? "rotate-90" : ""}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">{tx.creation_date}</TableCell>
                                        <TableCell className="text-center">{tx.type}</TableCell>
                                        <TableCell className="text-center">{tx.name}</TableCell>
                                        <TableCell className="text-center">{tx.payment_type}</TableCell>
                                        <TableCell className="text-center">{formatAmount(tx.amount_paid, club?.currency)}</TableCell>
                                        <TableCell className="text-center">{formatAmount(tx.amount, club?.currency)}</TableCell>
                                        <TableCell className={`text-center font-bold ${tx.status === "PENDING"
                                            ? "text-red-500"
                                            : tx.status === "PARTIALLY PAID"
                                                ? "text-orange-500"
                                                : "text-green-500"
                                            }`}>
                                            {tx.status}
                                        </TableCell>
                                    </TableRow>

                                    {/* Lifecycle Row */}
                                    {expandedRows[tx.transaction_id] && (
                                        <TableRow className="bg-muted/10">
                                            <TableCell colSpan={8} className="p-4">
                                                <div className="overflow-hidden rounded-lg border">
                                                    <Table className="w-full">
                                                        <TableHeader className="bg-muted sticky top-0 z-10">
                                                            <TableRow>
                                                                <TableHead className="text-center">Date</TableHead>
                                                                <TableHead className="text-center">Type</TableHead>
                                                                <TableHead className="text-center">Description</TableHead>
                                                                <TableHead className="text-center">Amount</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {Object.entries(tx.lifecycle)
                                                                // Sort by timestamp descending (latest first)
                                                                .sort(([a], [b]) => Number(b) - Number(a))
                                                                .map(([timestamp, entry]: any) => (
                                                                    <TableRow key={timestamp}>
                                                                        <TableCell className="text-center">
                                                                            {new Date(Number(timestamp)).toLocaleString("en-GB", {
                                                                                day: "2-digit",
                                                                                month: "2-digit",
                                                                                year: "numeric",
                                                                                hour: "2-digit",
                                                                                minute: "2-digit",
                                                                                hour12: true,
                                                                            })}
                                                                        </TableCell>
                                                                        <TableCell className="text-center">{entry.type}</TableCell>
                                                                        <TableCell className="text-center">{entry.description}</TableCell>
                                                                        <TableCell className={`text-center ${entry.type === "SUBMISSION" ? "text-red-500" : "text-green-500"} font-bold`}>{entry.type === "SUBMISSION" ? "-" : "+"}{formatAmount(entry.amount, club?.currency)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>


                )}
            </div>
        </div>
    );
}
