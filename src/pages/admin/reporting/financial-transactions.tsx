import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClubTransactions } from "@/queries/admin/transactions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAmount } from "@/data/currencies";
import { Label } from "@/components/ui/label";

export default function FinancialTransactionsPage() {
    const { club } = useContext(ClubContext) as ClubContextType

    const { data: transactions, isLoading } = useFetchClubTransactions(club?.club_account_id as string);
    console.log(transactions)
    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold">Financial Transactions</h1>
            <div className="overflow-hidden rounded-lg border mt-3">
                {
                    isLoading ? <Label>Loading...</Label>
                        :
                        <Table>
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="text-center w-1/4">
                                        Transaction ID
                                    </TableHead>
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
                                    isLoading ? <div>Loading...</div> :
                                        transactions?.transactions.map((key: any) => (
                                            <TableRow key={key.transaction_id}>
                                                <TableCell className="text-center w-1/4">
                                                    {key.transaction_id}
                                                </TableCell>
                                                <TableCell className="text-center w-1/4">
                                                    {key.date}
                                                </TableCell>
                                                <TableCell className="text-center w-1/4">
                                                    {key.payment_type}
                                                </TableCell>
                                                <TableCell className="text-center w-1/4">
                                                    {formatAmount(key.amount, club?.currency)}
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
        </div>
    );
}