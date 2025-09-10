import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/data/currencies";

export default function HomeDashboardPage() {
    const {club} = useContext(ClubContext) as ClubContextType
    const {data, isLoading} = useGeneralReportingQuery(club?.club_account_id as string)
    // const {data: r}= useRegistrationBillingReportingQuery(club?.club_account_id as string)
    const navigate = useNavigate()
    const manageRoutes = [
        {
            name: "Club",
            description: "Manage your club here",
            route: "/manage/club"
        },
        {
            name: "Members",
            description: "Manage your members here",
            route: "/manage/members"
        },
        {
            name: "Registration Form",
            description: "Manage your registration form here",
            route: "/manage/registrations/forms"
        },
    ]
  return (
    <div className="p-6 space-y-6 min-h-screen">
        <h1 className="text-base font-bold">General Report</h1>
        {!isLoading &&
            <div className="rounded-md overflow-x-scroll flex space-x-2">
                <Card className="flex-1">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle>Total Registered Members</CardTitle>
                            <CardDescription className="text-xs">
                                Showing total members registered
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center bg-muted rounded-full p-4 mx-auto w-12 h-12 justify-center items-center flex">{data?.report.total_registered_members}</div>
                    </CardContent>
                </Card>
                <Card className="flex-1">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle>Total Pending Members</CardTitle>
                            <CardDescription className="text-xs">
                                Showing total members pending
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center bg-muted rounded-full p-4 mx-auto w-12 h-12 justify-center items-center flex">{data?.report.total_pending_members}</div>
                    </CardContent>
                </Card>
                
                <Card className="flex-1">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle>Total Fees Due</CardTitle>
                            <CardDescription className="text-xs">
                                Showing number of registration fees due from pending members
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center bg-muted rounded-full p-4 mx-auto w-12 h-12 justify-center items-center flex">{formatAmount(data?.report.total_registration_fees_due_by_pending_members, club?.currency)}</div>
                    </CardContent>
                </Card>


                <Card className="flex-1">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle>Total Registration Fees</CardTitle>
                            <CardDescription className="text-xs">
                                Showing total registration fees
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center bg-muted rounded-full p-4 mx-auto min-w-12 h-12 justify-center items-center flex">{formatAmount(data?.report.total_registration_fees_paid, club?.currency)}</div>
                    </CardContent>
                </Card>


                <Card className="flex-1">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle>Total Extra fees</CardTitle>
                            <CardDescription className="text-xs">
                                Showing total extra fees owed by registered members
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center bg-muted rounded-full p-4 mx-auto w-12 h-12 justify-center items-center flex">{formatAmount(data?.report.total_extra_fees_owed_by_registered_members, club?.currency)}</div>
                    </CardContent>
                </Card>
            </div>
        }

      <h1 className="text-base font-bold">Manage</h1>
      <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
            <TableRow>
                <TableHead>Manage</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Action</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {
                manageRoutes.map(r => (
                    <TableRow onClick={() => navigate(r.route)} key={r.name}>
                        <TableCell className="font-bold">{r.name}</TableCell>
                        <TableCell>{r.description}</TableCell>
                        <TableCell><Button>View</Button></TableCell>
                    </TableRow>
                ))
            }
        </TableBody>
    </Table>
      </div>
    </div>
  );
}