import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { useContext, useEffect } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { HomeSectionCards } from "@/components/admin/club/home/section-cards";
import { Loader2 } from "lucide-react";
import { CardDescription } from "@/components/ui/card";
import { useFetchClub } from "@/queries/admin/clubs";

export default function HomeDashboardPage() {
    const { club, setClub } = useContext(ClubContext) as ClubContextType
    const { data: fetchedClub } = useFetchClub(club?.club_account_id as string);
    const { data: report, isLoading: reportLoading } = useGeneralReportingQuery(club?.club_account_id as string);

    const navigate = useNavigate()
    
    useEffect(() => {
        if (fetchedClub && club) {
            if (fetchedClub.season_cycle !== club.season_cycle || 
                JSON.stringify(fetchedClub) !== JSON.stringify(club)) {
                setClub(fetchedClub);
            }
        }
    }, [fetchedClub, club, setClub]);
    const manageRoutes = [
        {
            name: "Club",
            description: "Manage and edit your club page displayed to members here. You can update key details such as your bank information (visible to members), the support email address they can contact, and customize the email templates sent to members during registration and upon successful registration.",
            route: "/manage/club"
        },
        {
            name: "Members",
            description: "Register new members or manage individuals who are or have previously been associated with your club. You can oversee Active Members (registered), Pending Members (awaiting registration), and Deregistered Members.",
            route: "/manage/members"
        },
        {
            name: "Registration Form",
            description: "Create and manage a registration form specific to your club. Changes to this form are reflected for all members and automatically adjust related reporting for your club.",
            route: "/manage/registrations/forms"
        },
        {
            name: "Reporting",
            description: "View financial and general reports for your club.",
            route: "/reporting/general"
        }
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
                To view reports from the current or previous seasons, please visit the Reporting section.
            </CardDescription>
            {
                !reportLoading &&
                <div>
                    <HomeSectionCards report={report} currency={club?.currency} />
                    <div className="rounded-md border overflow-hidden md:my-3">
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead className="pl-5">Manage</TableHead>
                                    <TableHead className="px-5">Description</TableHead>
                                    <TableHead className="pr-10 items-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    manageRoutes.map(r => (
                                        <TableRow onClick={() => navigate(r.route)} key={r.name}>
                                            <TableCell className="font-bold pl-5">{r.name}</TableCell>
                                            <TableCell className="w-full whitespace-normal break-words align-middle px-5">
                                                <CardDescription> {r.description}</CardDescription>
                                            </TableCell>
                                            <TableCell className="pr-10 items-center"><Button>View</Button></TableCell>
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