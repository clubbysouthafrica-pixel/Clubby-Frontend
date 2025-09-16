import React, { useContext, useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFetchClubMembers } from "@/queries/admin/club-members";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClub } from "@/queries/clubs";
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { ClubMember } from "@/interfaces/club";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRegisterUserToClubMutation } from "@/mutations/admin/member";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import SendEmailDialog from "@/components/send-email-dialog";
import DeregisterDialog from "@/components/deregister-dialog";
import { formatAmount } from "@/data/currencies";
import { Input } from "@/components/ui/input";

export default function ListMembersPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data: clubMembers, isLoading: clubMembersLoading } = useFetchClubMembers(club?.club_account_id as string)
    const { data: clubDetails, isLoading: clubLoading, refetch } = useFetchClub(club?.club_account_id as string)
    const { mutate, isPending, isSuccess, isError, reset } = useRegisterUserToClubMutation()
    const [listActionItems, setlistActionItems] = useState<string[]>([])
    const [allMembersSelected, setAllMembersSelected] = useState(false)

    const [openDialogUserId, setOpenDialogUserId] = useState<string | null>(null);
    const [memberRegisterAmount, setMemberRegisterAmount] = useState(0)

    const sortableId = React.useId()

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    const setAllListActionItems = () => {
        if (allMembersSelected) {
            setlistActionItems([])
            setAllMembersSelected(false)
        } else {
            const allMembers = clubMembers.registered.map((member: ClubMember) => { return member.member_email });
            setlistActionItems(allMembers)
            setAllMembersSelected(true)
        }
    }

    const registerUser = (member: ClubMember) => {
        mutate({
            clubId: club?.club_account_id as string,
            userId: member.user_id,
            payment_amount: memberRegisterAmount
        }, {
            onSuccess: (response: any) => {
                if (!response.registered) {
                    clubMembers.unregistered.forEach((m: any) => {
                        if (m.user_id === member.user_id) {
                            m.outstanding_amount -= memberRegisterAmount
                        }
                    })
                } else {
                    window.location.reload();
                }
                setMemberRegisterAmount(0)
                refetch()
            },
        })
    }

    useEffect(() => {
        if (isSuccess) {
            setOpenDialogUserId(null); // Close the dialog after success
        }
    }, [isSuccess]);

    return (
        <div className="p-6 space-y-6 min-h-screen">
            <h1 className="text-base font-bold">List Club Members</h1>

            {/* Club Details */}
            {
                clubLoading &&
                <div>loading...</div>
            }
            {
                !clubLoading &&
                <div className="flex space-x-4 content-center">
                    <div className="text-4xl">{clubDetails?.club_name}</div>
                    <div className="content-ceter self-center"><Badge>{clubDetails?.club_type}</Badge></div>
                </div>
            }

            {/* Members Section */}
            {
                clubMembersLoading && <div>loading...</div>
            }
            {
                !clubMembersLoading &&
                <Tabs
                    defaultValue="registered-members"
                    className="w-full flex-col justify-start gap-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="view-selector" className="sr-only">
                            View
                        </Label>

                        <TabsList>
                            <TabsTrigger value="registered-members">
                                Registered Members <Badge variant="secondary">{clubMembers?.registered?.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="pending-members">
                                Pending Members <Badge variant="secondary">{clubMembers?.unregistered?.length ?? clubMembers?.not_registered?.length}</Badge>
                            </TabsTrigger>
                        </TabsList>
                        {/* ACTION ITEMS */}
                        <div className="flex-init space-x-2 items-center justify-center">
                            {club?.club_account_id && <DeregisterDialog clubId={club.club_account_id} disabled={!clubMembers?.registered?.length} />}
                            {club?.club_account_id && <SendEmailDialog clubId={club.club_account_id} contacts={listActionItems} />}
                        </div>
                    </div>
                    <TabsContent
                        value="registered-members"
                        className="relative flex flex-col gap-4 overflow-auto">

                        <div className="overflow-hidden rounded-lg border">
                            <DndContext
                                collisionDetection={closestCenter}
                                sensors={sensors}
                                id={sortableId}>

                                <Table>
                                    <TableHeader className="bg-muted sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="text-center">Display Name</TableHead>
                                            <TableHead className="text-center">Email</TableHead>
                                            <TableHead className="text-center">Outstanding Amount</TableHead>
                                            <TableHead className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    Action
                                                    <Checkbox 
                                                        className="bg-white" 
                                                        onCheckedChange={setAllListActionItems}
                                                    />
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clubMembers?.registered?.length ? clubMembers.registered.map((member: ClubMember) => (
                                            <TableRow key={member.user_id}>
                                                <TableCell className="text-center">{member.member_first_name + " " + member.member_surname}</TableCell>
                                                <TableCell className="text-center">{member.member_email}</TableCell>
                                                <TableCell className="text-center">{formatAmount(member.outstanding_amount, club?.currency)}</TableCell>
                                                {/* <TableCell><Badge>{member.billing_type}</Badge></TableCell> */}
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={listActionItems.includes(member.member_email as string)}           // keep UI in sync
                                                        onCheckedChange={(checked: boolean) =>
                                                            setlistActionItems(prev =>
                                                                checked
                                                                    ? prev.includes(member.member_email as string)          // add only if it’s not already there
                                                                        ? prev
                                                                        : [...prev, member.member_email as string]
                                                                    : prev.filter(id => id !== member.member_email as string) // remove when unchecked
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="h-24 text-center"
                                                >
                                                    No results.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </DndContext>
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="pending-members"
                        className="relative flex flex-col gap-4 overflow-auto">

                        <div className="overflow-hidden rounded-lg border">
                            <DndContext
                                collisionDetection={closestCenter}
                                sensors={sensors}
                                id={sortableId}>

                                <Table>
                                    <TableHeader className="bg-muted sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="text-center">Display Name</TableHead>
                                            {/* <TableHead>Billing Type</TableHead> */}
                                            <TableHead className="text-center">Registration Submitted</TableHead>
                                            <TableHead className="text-center">Reference Numbers</TableHead>
                                            <TableHead className="text-center">Outstanding Amount</TableHead>
                                            <TableHead className="text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clubMembers?.unregistered?.length ? clubMembers.unregistered.map((member: ClubMember) => (
                                            <TableRow key={member.user_id}>
                                                <TableCell className="text-center">{member.member_first_name + " " + member.member_surname}</TableCell>
                                                {/* <TableCell><Badge variant="outline">{member.billing_type}</Badge></TableCell> */}
                                                <TableCell className="text-center">
                                                    {member.registration_submitted_on ? (() => {
                                                        const date = new Date(member.registration_submitted_on);
                                                        const now = new Date();
                                                        const diffTime = Math.abs(now.getTime() - date.getTime());
                                                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                                                        return `${date.toLocaleString()} (${diffDays === 0 ? 'today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`})`;
                                                    })() : "-"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {member.registration_payment_reference}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {formatAmount(member.outstanding_amount, club?.currency)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Dialog
                                                        open={openDialogUserId === member.user_id}
                                                        onOpenChange={(open) => { reset(); setOpenDialogUserId(open ? member.user_id : null); setMemberRegisterAmount(0); }}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => { setOpenDialogUserId(member.user_id) }}
                                                            >
                                                                Register
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Register Member: <strong>{member.member_first_name + " " + member.member_surname}</strong></DialogTitle>
                                                                <DialogDescription>
                                                                    Confirm payment amount and register member
                                                                </DialogDescription>

                                                                <div className="grid gap-3">
                                                                    <Label htmlFor="pay">Payment Amount</Label>
                                                                    <Input
                                                                        id="pay"
                                                                        type="number"
                                                                        placeholder="Enter amount paid in cents"
                                                                        value={memberRegisterAmount}
                                                                        onChange={(e) => setMemberRegisterAmount(Number(e.target.value))}
                                                                        required={true}
                                                                    />
                                                                    <p className="text-sm">{formatAmount(memberRegisterAmount, club?.currency)}</p>
                                                                </div>
                                                                {
                                                                    isError &&
                                                                    <Alert variant="destructive">
                                                                        <AlertCircle className="h-4 w-4" />
                                                                        <AlertDescription className="text-xs">
                                                                            Something went wrong registering user
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                }
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <DialogClose asChild>
                                                                    <Button variant="outline">Cancel</Button>
                                                                </DialogClose>
                                                                <Button onClick={() => registerUser(member)} disabled={isPending}>{isPending ? "Registering..." : "Confirm"}</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="h-24 text-center"
                                                >
                                                    No results.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </DndContext>
                        </div>
                    </TabsContent>
                </Tabs>
            }
        </div>
    );
}