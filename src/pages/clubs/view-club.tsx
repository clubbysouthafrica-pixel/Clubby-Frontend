import Pager from "@/components/pager.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Calendar, Link as Loader2, Mail, MapPin } from "lucide-react";
import { useFetchClub, useFetchClubBankDetails } from "@/queries/clubs";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAmount } from "@/data/currencies";
import { useFetchUserTransactions } from "@/queries/transactions";
import * as React from "react";

// const loadingIcon = 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif';

function epochToJoinedString(epoch: number): string {
    const date = new Date(epoch); // if epoch is in seconds, use new Date(epoch * 1000)
    const options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
    const formatted = date.toLocaleDateString("en-US", options);
    return `Joined ${formatted}`;
}

const countryMap: Record<string, string> = {
    ZA: "South Africa",
    US: "United States",
    GB: "United Kingdom",
    DE: "Germany",
    FR: "France",
};

function getCountryName(code: string): string {
    return countryMap[code.toUpperCase()] ?? code;
}

export default function ViewClubPage() {
    const navigate = useNavigate()
    const { clubId } = useParams();
    const { data, isLoading, isError } = useFetchClub(clubId as string)
    const { data: bankDetails, isLoading: bankDetailsLoading } = useFetchClubBankDetails(
        clubId as string,
        !!data?.club_member_exists
    )

    const { data: transactions, isLoading: isUserTransactionsLoading } = useFetchUserTransactions(data?.club_account_id ?? "", data?.user_id ?? "");

    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const [coverImage, setCoverImage] = useState("")
    const [profileImage, setProfileImage] = useState("")

    useEffect(() => {
        const getImg = async () => {

            try {
                setCoverImage(data.club_cover_url)
                setProfileImage(data.club_profile_url)
            } catch (error) {
                console.error("Failed to fetch presigned URL", error)
            }
        }

        getImg()
    }, [data])

    return (
        <Pager>
            {
                isLoading &&
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>

            }
            {
                isError && <p> Something went wrong... </p>
            }
            {(!isLoading && !isError) &&
                <div className="container mx-auto px-4">
                    <div className="relative">
                        <Avatar className="w-full h-28 md:h-28 rounded-lg bg-muted/30 overflow-hidden border-background">
                            <AvatarImage className="w-full h-full object-cover object-center" src={coverImage ?? "https://images.unsplash.com/photo-1707343843598-39755549ac9a"} />
                            <AvatarFallback className="bg-white">
                                <img className="w-full h-full object-center bg-black" src={"https://images.unsplash.com/photo-1707343843598-39755549ac9a"} />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:space-x-6 px-4">
                            <Avatar className="w-32 h-32 border-4 border-background">
                                <AvatarImage className="object-cover object-center" src={profileImage ?? "https://github.com/shadcn.png"} />
                                <AvatarFallback>
                                    <img className="w-45 h-30 object-center bg-black" src={"https://images.unsplash.com/photo-1707343843598-39755549ac9a"} />
                                </AvatarFallback>
                            </Avatar>
                            <div className="mt-4 md:mt-0 text-center md:text-left flex-1">
                                <h1 className="text-2xl font-bold">{data?.club_name} <span className="ml-2 text-xs text-muted-foreground font-normal rounded-full">{data?.club_type}</span></h1>
                                {
                                    data?.description &&
                                    <h1 className="text-md">{data.description}</h1>
                                }
                            </div>
                            <div className="mt-4 md:mt-0 flex gap-4">
                                {
                                    !data?.club_member_exists &&
                                    <Button variant="outline" className="shadow-none" onClick={() => navigate(`/clubs/${clubId}/register`)}>Join</Button>
                                }
                                {
                                    data.resubmission_required &&
                                    <Button variant="outline" className="shadow-none text-red-700 border-red-700" onClick={() => navigate(`/clubs/${clubId}/register`)}>Re-register</Button>
                                }
                                {
                                    data?.club_member_exists && !data.resubmission_required &&
                                    <Button
                                        variant="outline"
                                        className={`
                                            shadow-none border-2 
                                            ${data.registered ? "text-green-700 border-green-700" : "text-orange-700 border-orange-700"}
                                            cursor-default pointer-events-none hover:bg-transparent hover:text-inherit hover:border-inherit
                                        `}
                                    >
                                        {data.registered ? "Member" : "Membership Pending"}
                                    </Button>

                                }
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Tabs defaultValue="home">
                            <TabsList className="justify-start h-10">
                                <>
                                    <TabsTrigger className="w-[150px]" value="home">Home</TabsTrigger>
                                    {
                                        data?.club_member_exists && !data?.resubmission_required &&
                                        <>
                                            <TabsTrigger className="w-[150px]" value="bank">Payments & Billing</TabsTrigger>
                                        </>
                                    }
                                </>
                            </TabsList>

                            <TabsContent value="home">
                                <div>
                                    <Card className="md:col-span-2 gap-4">
                                        <CardHeader>
                                            <CardTitle>{data.club_name}</CardTitle>
                                            <CardDescription>
                                                {data?.description ?? "This is the clubs home page."}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center">
                                                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span>{data.support_email}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span>{getCountryName(data.country_of_operation)}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span>{epochToJoinedString(data.joined)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {
                                data?.club_member_exists &&
                                <TabsContent value="bank">
                                    <Card className="w-full lg:w-1/3 text-xl border border-white shadow-none ">
                                        <CardTitle>
                                            Outstanding amount: {formatAmount(bankDetails?.outstanding_amount, data.currency)}
                                            <p className="text-[1rem] text-gray-500 mt-2 font-normal">
                                                Payment Reference Number: {bankDetails?.registration_payment_reference}
                                            </p>
                                        </CardTitle>
                                    </Card>
                                    <Card className="w-full lg:w-1/3">
                                        <CardHeader>
                                            <CardTitle>Banking Details</CardTitle>
                                            <CardDescription>Make any payments through EFT to the below banking details. Please make use of your <strong>payment reference number</strong> when making the payment.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {
                                                bankDetailsLoading &&
                                                <div className="flex justify-center py-8">
                                                    <Loader2 className="h-8 w-8 animate-spin" />
                                                </div>
                                            }
                                            {
                                                !bankDetailsLoading &&
                                                <Table>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell>Bank</TableCell>
                                                            <TableCell>{bankDetails?.bank}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>Account Number</TableCell>
                                                            <TableCell>{bankDetails?.account_number}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>Branch Code</TableCell>
                                                            <TableCell>{bankDetails?.branch_code}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>Account Type</TableCell>
                                                            <TableCell>{bankDetails?.account_type}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            }
                                        </CardContent>
                                    </Card>
                                    {
                                        !isUserTransactionsLoading && transactions &&
                                        <div className="mt-7">
                                            <h1 className="text-base font-bold">Transactions</h1>
                                            <div className="overflow-hidden rounded-lg border mt-3">
                                                <Table>
                                                    <TableHeader className="bg-muted sticky top-0 z-10">
                                                        <TableRow>
                                                            <TableHead className="text-center w-1/7">Transaction ID</TableHead>
                                                            <TableHead className="text-center w-1/7">Creation date</TableHead>
                                                            <TableHead className="text-center w-1/7">Type</TableHead>
                                                            <TableHead className="text-center w-1/7">Payment type</TableHead>
                                                            <TableHead className="text-center w-1/7">Amount Paid</TableHead>
                                                            <TableHead className="text-center w-1/7">Amount Owing</TableHead>
                                                            <TableHead className="text-center w-1/7">Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>

                                                    <TableBody>
                                                        {transactions.transactions.map((tx: any) => (
                                                            <React.Fragment key={tx.transaction_id}>
                                                                {/* Main Transaction Row */}
                                                                <TableRow
                                                                    className="cursor-pointer hover:bg-muted/50 transition"
                                                                    onClick={() => toggleRow(tx.transaction_id)}
                                                                >
                                                                    <TableCell className="text-center w-1/7">
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
                                                                    <TableCell className="text-center">{tx.payment_type}</TableCell>
                                                                    <TableCell className="text-center">{formatAmount(tx.amount_paid, data.currency)}</TableCell>
                                                                    <TableCell className="text-center">{formatAmount(tx.amount, data.currency)}</TableCell>
                                                                    <TableCell className={`text-center font-bold ${tx.status === "PENDING"
                                                                        ? "text-red-500"
                                                                        : tx.status === "PARTIALLY PAID"
                                                                            ? "text-orange-700"
                                                                            : "text-green-700"
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
                                                                                                    <TableCell className={`text-center ${entry.type === "SUBMISSION" ? "text-red-700" : "text-green-700"} font-bold`}>{entry.type === "SUBMISSION" ? "-" : "+"}{formatAmount(entry.amount, data.currency)}</TableCell>
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
                                            </div>
                                        </div>
                                    }
                                </TabsContent>
                            }
                        </Tabs>
                    </div>
                </div>
            }
        </Pager>
    )
}