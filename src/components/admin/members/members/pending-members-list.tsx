import { DndContext, closestCenter } from "@dnd-kit/core";
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClubMember } from "@/interfaces/club"
import { formatAmount } from "@/data/currencies"
import { Label } from "@/components/ui/label";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Club } from "@/context/ClubContext"
import { Checkbox } from "@/components/ui/checkbox";

interface ImageProps {
    club: Club | null
    sensors: any
    sortableId: any
    openDialogUserId: string | null
    displayAmount: string
    isPending: boolean
    invalidRegistrationAmount: boolean
    isError: any
    selectedTab: string
    clubMembers: any
    memberNameFilter: string
    dynamicFilters: Record<string, string>
    allMembersSelected: boolean
    listActionItems: string[]
    reset: () => void
    handleFormattedInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    registerUser: (member: ClubMember) => void
    setSelectedMember: React.Dispatch<React.SetStateAction<object>>
    setOpenDialogUserId: React.Dispatch<React.SetStateAction<string | null>>
    setlistActionItems: React.Dispatch<React.SetStateAction<string[]>>
    setMemberRegisterAmount: React.Dispatch<React.SetStateAction<number>>
    setDeregisterMembers: React.Dispatch<React.SetStateAction<{ user_id: string, name: string }[]>>
    setUnregisteredMembersLength: React.Dispatch<React.SetStateAction<number>>
    setAllListActionItems: (members: ClubMember[]) => void
    setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>
}

export default function PendingMembersList({
    club,
    sensors,
    sortableId,
    openDialogUserId,
    displayAmount,
    isPending,
    invalidRegistrationAmount,
    isError,
    selectedTab,
    clubMembers,
    memberNameFilter,
    dynamicFilters,
    allMembersSelected,
    listActionItems,
    reset,
    handleFormattedInputChange,
    registerUser,
    setSelectedMember,
    setlistActionItems,
    setOpenDialogUserId,
    setDeregisterMembers,
    setAllMembersSelected,
    setMemberRegisterAmount,
    setUnregisteredMembersLength,
    setAllListActionItems,
}: ImageProps) {

    const filteredUnregisteredMembers =
        selectedTab === "pending-members"
            ? clubMembers?.unregistered?.filter((member: ClubMember) => {
                const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
                if (!fullName.includes(memberNameFilter.toLowerCase())) return false;

                if (member?.resubmission_required) return false

                for (const [fullKey, selectedValue] of Object.entries(dynamicFilters)) {
                    if (!selectedValue || selectedValue === "all") continue;
                    const [type, fieldName] = fullKey.split(":");

                    if (type === "standard") {
                        const field = member.meta_standard?.find((f: any) => f.field_name === fieldName);
                        if (!field || field.value !== selectedValue) return false;
                    }

                    if (type === "billing") {
                        const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                        if (!field || field.label_value !== selectedValue) return false;
                    }
                }

                return true;
            }) ?? []
            : clubMembers?.unregistered?.filter((member: ClubMember) => !member?.resubmission_required) ?? [];

    useEffect(() => {
        setUnregisteredMembersLength(filteredUnregisteredMembers.length);
    }, [filteredUnregisteredMembers, setUnregisteredMembersLength]);

    return (
        <div className="overflow-hidden rounded-lg border">
            <DndContext
                collisionDetection={closestCenter}
                sensors={sensors}
                id={sortableId}>

                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="text-center w-1/7">Display Name</TableHead>
                            <TableHead className="text-center w-1/7">Member ID</TableHead>
                            <TableHead className="text-center w-1/7">Registration Submitted</TableHead>
                            <TableHead className="text-center w-1/7">Reference Numbers</TableHead>
                            <TableHead className="text-center w-1/7">Outstanding Amount</TableHead>
                            <TableHead className="text-center w-1/7">Register member</TableHead>
                            <TableHead className="text-center w-1/5">
                                <div className="flex items-center justify-center gap-2">
                                    Action
                                    <Checkbox
                                        className="bg-white"
                                        onCheckedChange={() => setAllListActionItems(filteredUnregisteredMembers)}
                                        checked={allMembersSelected}
                                    />
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUnregisteredMembers.length ? filteredUnregisteredMembers.map((member: ClubMember) => (
                            <TableRow key={member.user_id}>
                                <TableCell className="text-center w-1/7">
                                    <a
                                        onClick={() => setSelectedMember(member)}
                                        href={`#${member.user_id}`}
                                        className="underline hover:text-blue-800 cursor-pointer"
                                    >
                                        {member.member_first_name + " " + member.member_surname}
                                    </a>
                                </TableCell>
                                <TableCell className="text-center w-1/7">
                                    <div className="inline-flex items-center gap-2 justify-center">
                                        <span className="font-mono">{member.user_id.slice(0, 8)}...</span>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(member.user_id);
                                            }}
                                            title="Click to copy full Transaction ID"
                                            className="hover:text-primary cursor-pointer"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-muted-foreground hover:text-foreground transition"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 16h8m2 0a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2zM8 16v2a2 2 0 002 2h8a2 2 0 002-2v-2"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center w-1/7">
                                    {member.registration_submitted_on ? (() => {
                                        const date = new Date(member.registration_submitted_on);
                                        const now = new Date();
                                        const diffTime = Math.abs(now.getTime() - date.getTime());
                                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                                        return `${date.toLocaleString()} (${diffDays === 0 ? 'today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`})`;
                                    })() : "-"}
                                </TableCell>
                                <TableCell className="text-center w-1/7">
                                    {member.registration_payment_reference}
                                </TableCell>
                                <TableCell className="text-center w-1/7">
                                    {member.resubmission_required ? "N/A" : formatAmount(member.outstanding_amount, club?.currency)}
                                </TableCell>
                                <TableCell className="text-center w-1/7">
                                    <div>
                                        <Dialog
                                            open={openDialogUserId === member.user_id}
                                            onOpenChange={(open) => { reset(); setOpenDialogUserId(open ? member.user_id : null); setMemberRegisterAmount(0); }}>
                                            <div className="flex justify-center items-center">
                                                <DialogTrigger asChild>
                                                    {
                                                        member.resubmission_required ? <Label className="text-red-500 font-bold">Member resubmission required</Label> :
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => { setOpenDialogUserId(member.user_id) }}
                                                            >
                                                                Register
                                                            </Button>
                                                    }
                                                </DialogTrigger>
                                            </div>
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
                                                            The amount entered cannot be less than {formatAmount(1, club?.currency)} and more than the outstanding amount.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center w-1/7">
                                    <Checkbox
                                        checked={listActionItems.includes(member.member_email as string)}
                                        onCheckedChange={(checked: boolean) => {
                                            setlistActionItems([])
                                            setDeregisterMembers([])
                                            setAllMembersSelected(false)
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
    )
}
