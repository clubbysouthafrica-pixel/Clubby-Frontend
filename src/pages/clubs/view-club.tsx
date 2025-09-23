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
                    {/* Profile Header */}
                    <div className="relative">
                        {/* Cover Image */}
                        <Avatar className="w-full h-28 md:h-28 rounded-lg bg-muted/30 overflow-hidden border-background">
                            <AvatarImage className="w-full h-full object-cover object-center" src={coverImage ?? "https://images.unsplash.com/photo-1707343843598-39755549ac9a"} />
                            <AvatarFallback className="rounded-none">{data?.club_name ?? "Background"}</AvatarFallback>
                        </Avatar>

                        {/* Profile Info */}
                        <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:space-x-6 px-4">
                            <Avatar className="w-32 h-32 border-4 border-background">
                                <AvatarImage className="object-cover object-center" src={profileImage ?? "https://github.com/shadcn.png"} />
                                <AvatarFallback>JD</AvatarFallback>
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
                                    data?.club_member_exists &&
                                    <div className={"rounded-lg p-2 text-sm outline outline-[3px] " + (data.registered ? "outline-green-600 text-green-700 text-[1rem]" : "outline-yellow-600 text-yellow-700 text-[1rem]")}>
                                        {
                                            data.registered ? "Member" : "Membership Pending"
                                        }
                                    </div>
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
                                        data?.club_member_exists &&
                                        <>
                                            <TabsTrigger className="w-[150px]" value="bank">Payments & Billing</TabsTrigger>
                                            <TabsTrigger className="w-[150px]" value="transactions">Transactions</TabsTrigger>
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
                                </TabsContent>
                            }
                            {
                                data?.club_member_exists && !isUserTransactionsLoading && transactions &&
                                <TabsContent value="transactions">
                                    <div className="overflow-hidden rounded-lg border mt-3">
                                        <Table>
                                            <TableHeader className="bg-muted sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="text-center w-1/6">
                                                        Transaction ID
                                                    </TableHead>
                                                    <TableHead className="text-center w-1/6">
                                                        Member name
                                                    </TableHead>
                                                    <TableHead className="text-center w-1/6">
                                                        Date
                                                    </TableHead>
                                                    <TableHead className="text-center w-1/6">
                                                        Payment type
                                                    </TableHead>
                                                    <TableHead className="text-center w-1/6">
                                                        Amount
                                                    </TableHead>
                                                    <TableHead className="text-center w-1/6">
                                                        Status
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {
                                                    isLoading ? <div>Loading...</div> :
                                                        transactions?.transactions.map((key: any) => (
                                                            <TableRow key={key.transaction_id}>
                                                                <TableCell className="text-center w-1/6">
                                                                    <div
                                                                        className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted hover:bg-muted/70 cursor-pointer text-sm transition"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(key.transaction_id);
                                                                        }}
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
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8m2 0a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2zM8 16v2a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                                                        </svg>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center w-1/6">
                                                                    {key.name}
                                                                </TableCell>
                                                                <TableCell className="text-center w-1/6">
                                                                    {key.date}
                                                                </TableCell>
                                                                <TableCell className="text-center w-1/6">
                                                                    {key.payment_type}
                                                                </TableCell>
                                                                <TableCell className="text-center w-1/6">
                                                                    {formatAmount(key.amount, "ZAR")}
                                                                </TableCell>
                                                                <TableCell className={`text-center font-bold w-1/4 ${key.status === "PENDING" ? "text-red-500" : "text-green-500"}`}>
                                                                    {key.status}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                            }
                        </Tabs>
                    </div>
                </div>
            }
        </Pager>
    )
}