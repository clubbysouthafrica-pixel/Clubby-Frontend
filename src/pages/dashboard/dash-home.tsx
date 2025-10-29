import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { HomeSectionCards } from "@/components/admin/club/home/section-cards";
import { Loader2 } from "lucide-react";
import { CardDescription } from "@/components/ui/card";

export default function HomeDashboardPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data: report, isLoading: reportLoading } = useGeneralReportingQuery(club?.club_account_id as string);

    const navigate = useNavigate()
    const manageRoutes = [
        {
            name: "Club",
            description: "Manage and edit your club page that is displayed to members here",
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

    if (reportLoading) {
        return (
            <div className="p-5 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-5">
            <h1 className="text-xl font-bold">Current Season: {club?.season_cycle}</h1>
            <CardDescription className="mb-4">
                To view reports from previous seasons, please visit the Historical Reporting section.
            </CardDescription>
            {
                !reportLoading &&
                <div>
                    <HomeSectionCards report={report} currency={club?.currency} />
                    <div className="rounded-md border overflow-hidden md:my-3">
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
            }
        </div>
    );
}