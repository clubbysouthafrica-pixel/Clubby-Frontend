import Pager from "@/components/pager.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Calendar, Link as LinkIcon, Loader2, Mail, MapPin} from "lucide-react";
import { useFetchClub, useFetchClubBankDetails } from "@/queries/clubs";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { clubCoverImagePresignedUrl, clubProfileImagePresignedUrl, fetchImagePresignedUrl } from "@/services/image";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatAmount } from "@/data/currencies";

export default function ViewClubPage() {
    const navigate = useNavigate()
    const { clubId } = useParams();
    const { data, isLoading, isError } = useFetchClub(clubId as string)
    const { data: bankDetails, isLoading: bankDetailsLoading} = useFetchClubBankDetails(
        clubId as string,
        !!data?.club_member_exists
    )

    const [coverImage, setCoverImage] = useState("")
    const [profileImage, setProfileImage] = useState("")

    useEffect(() => {
        const getImg = async () => {
          try {
            const { fetchUrl: coverFetch } = await fetchImagePresignedUrl(clubCoverImagePresignedUrl(clubId as string))
            const { fetchUrl } = await fetchImagePresignedUrl(clubProfileImagePresignedUrl(clubId as string))
            setCoverImage(coverFetch)
            setProfileImage(fetchUrl)
          } catch (error) {
            console.error("Failed to fetch presigned URL", error)
          }
        }
    
        getImg()
      }, [clubId])

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
            { (!isLoading && !isError) &&
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
                                    <div className={"outline rounded-lg p-2 text-sm " + (data.registered ? "outline-green-600" : "outline-yellow-300")}>
                                        {
                                            data.registered ? "Member" : "Membership Pending"
                                        }
                                    </div>
                            }
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="mt-6">
                    <Tabs defaultValue="home">
                                    <TabsList className="justify-start h-10">
                                            <>
                                            <TabsTrigger value="home">Home</TabsTrigger>
                                            {
                                                data?.club_member_exists &&
                                                <TabsTrigger value="bank">Bank Details</TabsTrigger>
                                            }
                                            {/* <TabsTrigger value="membership">Membership</TabsTrigger>
                                            <TabsTrigger value="storage">Storage</TabsTrigger>
                                            <TabsTrigger value="extra">Extra</TabsTrigger>
                                            <TabsTrigger value="history">Account History</TabsTrigger> */}
                                            </>
                                    </TabsList>
                        {/*<Separator className="my-6" />*/}

                        <TabsContent value="home">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Bio Section */}
                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Bio</CardTitle>
                                        <CardDescription>
                                            A passionate developer with expertise in React and TypeScript
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>john.doe@example.com</span>
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>San Francisco, CA</span>
                                            </div>
                                            <div className="flex items-center">
                                                <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <a href="#" className="text-primary">github.com/johndoe</a>
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>Joined March 2024</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Stats Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Stats</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Followers</span>
                                                <span className="font-medium">1.2k</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Following</span>
                                                <span className="font-medium">427</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Projects</span>
                                                <span className="font-medium">32</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {
                            data?.club_member_exists &&
                            <TabsContent value="bank">
                                <Card className="w-full lg:w-1/3">
                                    <CardHeader>
                                        <CardTitle>Banking Details</CardTitle>
                                        <CardDescription>Make any payments through EFT to this banking details. Please make use of the payment reference number</CardDescription>
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
                                                    <TableRow>
                                                        <TableCell>Reference Number</TableCell>
                                                        <TableCell>{bankDetails?.registration_payment_reference}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell>Outstanding Amount:</TableCell>
                                                        <TableCell>{formatAmount(bankDetails?.outstanding_amount)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                            // <>
                                            //     <p>Bank: <span className="font-semibold ml-4">{bankDetails?.bank}</span></p>
                                            //     <p>Account Number: <span className="font-semibold ml-4">{bankDetails?.account_number}</span></p>
                                            //     <p>Branch Code: <span className="font-semibold ml-4">{bankDetails?.branch_code}</span></p>
                                            //     <p>Account Type: <span className="font-semibold ml-4">{bankDetails?.account_type}</span></p>
                                            // </>
                                        }
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        }
{/* 
                        <TabsContent value="membership">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Membership</CardTitle>
                                    <CardDescription>Your recent posts will appear here.</CardDescription>
                                </CardHeader>
                            </Card>
                        </TabsContent>

                        <TabsContent value="storage">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Storage</CardTitle>
                                    <CardDescription>Your storage data will appear here.</CardDescription>
                                </CardHeader>
                            </Card>
                        </TabsContent>

                        <TabsContent value="extra">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Extra</CardTitle>
                                    <CardDescription>Club Extra details will appear here.</CardDescription>
                                </CardHeader>
                            </Card>
                        </TabsContent>
                        <TabsContent value="history">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account history</CardTitle>
                                    <CardDescription>Club account history will appear here.</CardDescription>
                                </CardHeader>
                            </Card>
                        </TabsContent> */}
                    </Tabs>
                </div>
            </div>
            }
        </Pager>
    )
}