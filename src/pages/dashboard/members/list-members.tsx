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
import DeregisterAllDialog from "@/components/deregister-dialog";
import DeregisterMembersDialog from "@/components/admin/members/members/deregister-members";
import SelectedMember from "@/components/admin/members/members/selected-members";
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
    const [dereigsterMembers, setDeregisterMembers] = useState<{ user_id: string, name: string }[]>([])
    const [hashUserId, setHashUserId] = useState<string | null>(null);
    const [selectedMember, setSelectedMember] = useState({})
    const [memberRegisterAmount, setMemberRegisterAmount] = useState<number>(0);
    const [displayAmount, setDisplayAmount] = useState<string>(formatAmount(0, club?.currency));
    const [invalidRegistrationAmount, setInvalidRegistrationAmount] = useState(false)

    const handleFormattedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInvalidRegistrationAmount(false)
        const inputValue = e.target.value.replace(/[^\d]/g, "");
        const numericValue = parseInt(inputValue || "0", 10);

        setMemberRegisterAmount(numericValue);
        setDisplayAmount(formatAmount(numericValue, club?.currency));
    };

    const sortableId = React.useId()

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    const setAllListActionItems = () => {
        if (allMembersSelected) {
            setlistActionItems([])
            setDeregisterMembers([])
            setAllMembersSelected(false)
        } else {
            const allMembers = clubMembers.registered.map((member: ClubMember) => { return member.member_email });
            const allDeregisterMembers = clubMembers.registered.map((member: ClubMember) => { return { user_id: member.user_id, name: `${member.member_first_name} ${member.member_surname}` } })
            setlistActionItems(allMembers)
            setAllMembersSelected(true)
            setDeregisterMembers(allDeregisterMembers)
        }
    }

    useEffect(() => {
        setDisplayAmount(formatAmount(0, club?.currency))
    }, [club]);

    useEffect(() => {
        const updateHash = () => {
            const hash = window.location.hash.replace("#", "");
            setHashUserId(hash || null);
        };

        updateHash();
        window.addEventListener("hashchange", updateHash);

        return () => {
            window.removeEventListener("hashchange", updateHash);
        };
    }, []);

    const registerUser = (member: ClubMember) => {
        if (memberRegisterAmount > member.outstanding_amount || memberRegisterAmount < 0) {
            setInvalidRegistrationAmount(true)
            return
        }

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
            setOpenDialogUserId(null);
        }
    }, [isSuccess]);

    // console.log(clubMembers)

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
                    onValueChange={() => {
                        setHashUserId(null);
                        setSelectedMember({});
                        window.history.pushState("", document.title, window.location.pathname + window.location.search); // remove hash from URL
                    }}
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
                        <div className="flex-init px-5 space-x-5 items-center justify-center">
                            {club?.club_account_id && <DeregisterAllDialog clubId={club.club_account_id} disabled={!clubMembers?.registered?.length} />}
                            {club?.club_account_id && <DeregisterMembersDialog dereigsterMembers={dereigsterMembers} clubId={club.club_account_id} setlistActionItems={setlistActionItems} setDeregisterMembers={setDeregisterMembers} setAllMembersSelected={setAllMembersSelected} />}
                            {club?.club_account_id && <SendEmailDialog clubId={club.club_account_id} contacts={listActionItems} setlistActionItems={setlistActionItems} setDeregisterMembers={setDeregisterMembers} setAllMembersSelected={setAllMembersSelected} />}
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
                                                        checked={allMembersSelected}
                                                    />
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clubMembers?.registered?.length ? clubMembers.registered.map((member: ClubMember) => (
                                            <TableRow key={member.user_id}>
                                                <TableCell className="text-center">
                                                    <a
                                                        onClick={() => setSelectedMember(member)}
                                                        href={`#${member.user_id}`}
                                                        className="underline text-blue-600 hover:text-blue-800 cursor-pointer"
                                                    >
                                                        {member.member_first_name + " " + member.member_surname}
                                                    </a>
                                                </TableCell>
                                                <TableCell className="text-center">{member.member_email}</TableCell>
                                                <TableCell className="text-center">{formatAmount(member.outstanding_amount, club?.currency)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={listActionItems.includes(member.member_email as string)}
                                                        onCheckedChange={(checked: boolean) => {
                                                            setlistActionItems(prev =>
                                                                checked
                                                                    ? prev.includes(member.member_email as string)
                                                                        ? prev
                                                                        : [...prev, member.member_email as string]
                                                                    : prev.filter(id => id !== member.member_email as string)
                                                            )
                                                            setDeregisterMembers(prev =>
                                                                checked
                                                                    ? prev.some(m => m.user_id === member.user_id)
                                                                        ? prev
                                                                        : [...prev, { user_id: member.user_id, name: `${member.member_first_name} ${member.member_surname}` }]
                                                                    : prev.filter(m => m.user_id !== member.user_id)
                                                            )
                                                        }}
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
                                                <TableCell className="text-center">
                                                    <a
                                                        onClick={() => setSelectedMember(member)}
                                                        href={`#${member.user_id}`}
                                                        className="underline text-blue-600 hover:text-blue-800 cursor-pointer"
                                                    >
                                                        {member.member_first_name + " " + member.member_surname}
                                                    </a>
                                                </TableCell>
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

                                                                <Label className="my-3 text-l">Outstanding amount: {formatAmount(member.outstanding_amount, club?.currency)}</Label>

                                                                <div className="grid gap-3">
                                                                    <Label htmlFor="pay">Payment Amount</Label>
                                                                    <Input
                                                                        id="pay"
                                                                        type="text"
                                                                        placeholder="Enter amount"
                                                                        value={displayAmount}
                                                                        onChange={handleFormattedInputChange}
                                                                    />
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
                                                            {invalidRegistrationAmount && (
                                                                <Alert className="border border-red-600 text-red-600">
                                                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                                                    <AlertDescription className="text-xs text-red-600">
                                                                        The amount entered cannot be less than {formatAmount(0, club?.currency)} and more than the outstanding amount.
                                                                    </AlertDescription>
                                                                </Alert>
                                                            )}
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
            {
                hashUserId && <SelectedMember selectedMember={selectedMember} setSelectedMember={setSelectedMember} currency={club?.currency ?? "ZAR"} />
            }
        </div>
    );
}