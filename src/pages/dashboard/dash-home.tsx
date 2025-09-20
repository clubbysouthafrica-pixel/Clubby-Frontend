import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { SectionCards } from "@/components/section-cards";
import { formatAmount } from "@/data/currencies";
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import * as React from "react";

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

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )
    const sortableId = React.useId()

    if (isLoading || !report) {
        return <div className="p-5">Loading...</div>;
    }

    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold mt-5">General Report</h1>
            {!isLoading &&
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                        <SectionCards report={report} currency={club?.currency as string} />
                    </div>
                </div>
            }
            {
                <div className="overflow-hidden rounded-lg border">
                    <DndContext
                        collisionDetection={closestCenter}
                        sensors={sensors}
                        id={sortableId}>
                        <Table>
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="text-center font-bold">Month</TableHead>
                                    <TableHead className="text-center font-bold">Active members</TableHead>
                                    <TableHead className="text-center font-bold">Revenue</TableHead>
                                    <TableHead className="text-center font-bold">Pending members</TableHead>
                                    <TableHead className="text-center font-bold">Pending revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.data?.map((month: any) => (
                                    <TableRow key={month.date}>
                                        <TableCell className="text-center font-bold">{month.date}</TableCell>
                                        <TableCell className="text-center">{month.total_registered_members}</TableCell>
                                        <TableCell className="text-center">{formatAmount(month.total_registration_fees_paid, club?.currency)}</TableCell>
                                        <TableCell className="text-center">{formatAmount(month.total_pending_members, club?.currency)}</TableCell>
                                        <TableCell className="text-center">{formatAmount(month.total_registration_fees_due_by_pending_members, club?.currency)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DndContext>
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