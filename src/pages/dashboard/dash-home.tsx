import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { SectionCards } from "@/components/section-cards";
// import { ChartAreaInteractive } from "@/components/chart-area-interactive";

export default function HomeDashboardPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data, isLoading } = useGeneralReportingQuery(club?.club_account_id as string)
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

    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold mt-5">General Report</h1>
            {!isLoading &&
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                        <SectionCards report={data} currency={club?.currency as string} />
                        {/* <div className="px-4 lg:px-0">
                            <ChartAreaInteractive data={data?.data} />
                        </div> */}
                    </div>
                </div>
            }
            <h1 className="text-base font-bold mt-5">Manage</h1>
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