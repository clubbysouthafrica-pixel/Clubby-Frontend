import { useContext } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { GeneralReportingSectionCards } from "@/components/admin/reporting/general-reporting/section-cards";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAmount } from "@/data/currencies";
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import * as React from "react";

export default function GeneralReportingPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data: report, isLoading } = useGeneralReportingQuery(club?.club_account_id as string);

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )
    const sortableId = React.useId()

    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold mt-5">General Report</h1>
            {!isLoading && report &&
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                        <GeneralReportingSectionCards report={report} currency={club?.currency as string} />
                    </div>
                </div>
            }
            { !isLoading && report &&
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
                                        <TableCell className="text-center">{month.total_pending_members}</TableCell>
                                        <TableCell className="text-center">{formatAmount(month.total_registration_fees_due_by_pending_members, club?.currency)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DndContext>
                </div>
            }
        </div>
    );
}