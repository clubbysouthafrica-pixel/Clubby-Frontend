import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";

export default function HomeDashboardPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data: report, isLoading } = useGeneralReportingQuery(club?.club_account_id as string)
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

    if (isLoading || !report) {
        return <div className="p-5">Loading...</div>;
    }

    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold">Manage</h1>
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
    );
}