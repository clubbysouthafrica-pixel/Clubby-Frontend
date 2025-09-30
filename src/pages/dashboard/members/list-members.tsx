import React, { useContext, useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFetchClubMembers } from "@/queries/admin/club-members";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
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
import DeregisterMembersDialog from "@/components/admin/members/members/deregister-members";
import SelectedMember from "@/components/admin/members/members/selected-members";
import { formatAmount } from "@/data/currencies";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ListMembersPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data: clubMembers, isLoading: clubMembersLoading } = useFetchClubMembers(club?.club_account_id as string)
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
    const [memberNameFilter, setMemberNameFilter] = useState("");
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>({});
    const [filterLoading, setFilterLoading] = useState(true);

    const [selectedTab, setSelectedTab] = useState("registered-members");

    const [availableDynamicFilters, setAvailableDynamicFilters] = useState<
        { key: string, fieldName: string, type: string, options: string[] }[]
    >([]);

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

    const setAllListActionItems = (members: ClubMember[]) => {
        if (allMembersSelected) {
            setlistActionItems([])
            setDeregisterMembers([])
            setAllMembersSelected(false)
        } else {
            const allMembers = members.map((member: ClubMember) => { return member.member_email as string });
            const allDeregisterMembers = members.map((member: ClubMember) => { return { user_id: member.user_id, name: `${member.member_first_name} ${member.member_surname}` } })
            setlistActionItems(allMembers)
            setAllMembersSelected(true)
            setDeregisterMembers(allDeregisterMembers)
        }
    }

    useEffect(() => {
        if (!clubMembers?.registered && !clubMembers?.unregistered) return;

        const fieldMap: Record<string, Set<string>> = {};

        if (clubMembers?.registered) {
            clubMembers?.registered.forEach((member: ClubMember) => {
                member.meta_standard?.forEach((field: any) => {
                    if (field.type === "STANDARD_DROPDOWN" && field.value) {
                        const key = `standard:${field.field_name}`;
                        if (!fieldMap[key]) fieldMap[key] = new Set();
                        fieldMap[key].add(field.value);
                    }
                });

                member.meta_billing?.forEach((field: any) => {
                    if (field.type === "BILLING_DROPDOWN" && field.label_value) {
                        const key = `billing:${field.field_name}`;
                        if (!fieldMap[key]) fieldMap[key] = new Set();
                        fieldMap[key].add(field.label_value);
                    }
                });
            });
        }

        if (clubMembers?.unregistered) {
            clubMembers?.unregistered?.forEach((member: ClubMember) => {
                member.meta_standard?.forEach((field: any) => {
                    if (field.type === "STANDARD_DROPDOWN" && field.value) {
                        const key = `standard:${field.field_name}`;
                        if (!fieldMap[key]) fieldMap[key] = new Set();
                        fieldMap[key].add(field.value);
                    }
                });

                member.meta_billing?.forEach((field: any) => {
                    if (field.type === "BILLING_DROPDOWN" && field.label_value) {
                        const key = `billing:${field.field_name}`;
                        if (!fieldMap[key]) fieldMap[key] = new Set();
                        fieldMap[key].add(field.label_value);
                    }
                });
            });
        }

        const filters = Object.entries(fieldMap).map(([fullKey, values]) => {
            const [type, field] = fullKey.split(":");
            return {
                key: fullKey,
                fieldName: field,
                type,
                options: Array.from(values)
            };
        });

        setAvailableDynamicFilters(filters);
        setFilterLoading(false);
    }, [clubMembers]);

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
        if (memberRegisterAmount > member.outstanding_amount || memberRegisterAmount <= 0) {
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
                    const index = clubMembers.unregistered.findIndex((m: ClubMember) => m.user_id === member.user_id)
                    clubMembers.unregistered.splice(index, 1);
                    member.outstanding_amount = 0
                    clubMembers.registered.push(member)
                }
                setMemberRegisterAmount(0)
            },
        })
    }

    useEffect(() => {
        if (isSuccess) {
            setOpenDialogUserId(null);
        }
    }, [isSuccess]);

    const filteredRegisteredMembers =
        selectedTab === "registered-members"
            ? clubMembers?.registered?.filter((member: ClubMember) => {
                const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
                if (!fullName.includes(memberNameFilter.toLowerCase())) return false;

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
            : clubMembers?.registered ?? [];

    const filteredUnregisteredMembers =
        selectedTab === "pending-members"
            ? clubMembers?.unregistered?.filter((member: ClubMember) => {
                const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
                if (!fullName.includes(memberNameFilter.toLowerCase())) return false;

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
            : clubMembers?.unregistered ?? [];

    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold">Club Members</h1>
            {
                (clubMembersLoading || filterLoading) && <div>loading...</div>
            }
            {
                !clubMembersLoading && !filterLoading &&
                <Tabs
                    defaultValue="registered-members"
                    onValueChange={(value: string) => {
                        setSelectedTab(value);
                        setHashUserId(null);
                        setSelectedMember({});
                        window.history.pushState("", document.title, window.location.pathname + window.location.search);

                        setMemberNameFilter("");
                        setDynamicFilters({});
                    }}
                    className="w-full flex-col justify-start gap-1 mt-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="view-selector" className="sr-only">
                            View
                        </Label>

                        <TabsList >
                            <TabsTrigger value="registered-members" className="p-2">
                                Completed Registrations <Badge variant="secondary">{filteredRegisteredMembers.length ?? 0}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="pending-members" className="p-2" >
                                Members Pending <Badge variant="secondary">{filteredUnregisteredMembers.length ?? 0}</Badge>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <div className="flex flex-wrap justify-between gap-4 mt-4">
                        {/* Left Side: Filters */}
                        <div className="flex flex-wrap gap-3 flex-1 min-w-[300px]">
                            <Input
                                placeholder="Filter by member name"
                                value={memberNameFilter}
                                onChange={(e) => setMemberNameFilter(e.target.value)}
                                className="w-[300px]"
                            />
                            {availableDynamicFilters.map(({ key, fieldName, options }) => (
                                <Select
                                    key={key}
                                    onValueChange={(value) =>
                                        setDynamicFilters(prev => ({ ...prev, [key]: value }))
                                    }
                                    value={dynamicFilters[key] || ""}
                                >
                                    <SelectTrigger className="w-[250px]">
                                        <span className="text-muted-foreground truncate">{fieldName}</span>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {options.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ))}
                        </div>

                        <div className="px-2 py-1 flex items-center gap-3">
                            {club?.club_account_id && (
                                <DeregisterMembersDialog
                                    dereigsterMembers={dereigsterMembers}
                                    clubId={club.club_account_id}
                                    setlistActionItems={setlistActionItems}
                                    setDeregisterMembers={setDeregisterMembers}
                                    setAllMembersSelected={setAllMembersSelected}
                                />
                            )}
                            {club?.club_account_id && (
                                <SendEmailDialog
                                    clubId={club.club_account_id}
                                    contacts={listActionItems}
                                    setlistActionItems={setlistActionItems}
                                    setDeregisterMembers={setDeregisterMembers}
                                    setAllMembersSelected={setAllMembersSelected}
                                />
                            )}
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
                                            <TableHead className="text-center w-1/5">Member name</TableHead>
                                            <TableHead className="text-center w-1/5">Member ID</TableHead>
                                            <TableHead className="text-center w-1/5">Email</TableHead>
                                            <TableHead className="text-center w-1/5">Outstanding Amount</TableHead>
                                            <TableHead className="text-center w-1/5">
                                                <div className="flex items-center justify-center gap-2">
                                                    Action
                                                    <Checkbox
                                                        className="bg-white"
                                                        onCheckedChange={() => setAllListActionItems(filteredRegisteredMembers)}
                                                        checked={allMembersSelected}
                                                    />
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRegisteredMembers.length ? filteredRegisteredMembers.map((member: ClubMember) => (
                                            <TableRow key={member.user_id}>
                                                <TableCell className="text-center w-1/5">
                                                    <a
                                                        onClick={() => setSelectedMember(member)}
                                                        href={`#${member.user_id}`}
                                                        className="underline text-blue-600 hover:text-blue-800 cursor-pointer"
                                                    >
                                                        {member.member_first_name + " " + member.member_surname}
                                                    </a>
                                                </TableCell>
                                                <TableCell className="text-center w-1/5">
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
                                                <TableCell className="text-center w-1/5">{member.member_email}</TableCell>
                                                <TableCell className="text-center w-1/5">{formatAmount(member.outstanding_amount, club?.currency)}</TableCell>
                                                <TableCell className="text-center w-1/5">
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
                                            <TableHead className="text-center w-1/6">Display Name</TableHead>
                                            <TableHead className="text-center w-1/6">Member ID</TableHead>
                                            <TableHead className="text-center w-1/6">Registration Submitted</TableHead>
                                            <TableHead className="text-center w-1/6">Reference Numbers</TableHead>
                                            <TableHead className="text-center w-1/6">Outstanding Amount</TableHead>
                                            <TableHead className="text-center w-1/6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUnregisteredMembers.length ? filteredUnregisteredMembers.map((member: ClubMember) => (
                                            <TableRow key={member.user_id}>
                                                <TableCell className="text-center w-1/6">
                                                    <a
                                                        onClick={() => setSelectedMember(member)}
                                                        href={`#${member.user_id}`}
                                                        className="underline text-blue-600 hover:text-blue-800 cursor-pointer"
                                                    >
                                                        {member.member_first_name + " " + member.member_surname}
                                                    </a>
                                                </TableCell>
                                                <TableCell className="text-center w-1/6">
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
                                                <TableCell className="text-center w-1/6">
                                                    {member.registration_submitted_on ? (() => {
                                                        const date = new Date(member.registration_submitted_on);
                                                        const now = new Date();
                                                        const diffTime = Math.abs(now.getTime() - date.getTime());
                                                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                                                        return `${date.toLocaleString()} (${diffDays === 0 ? 'today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`})`;
                                                    })() : "-"}
                                                </TableCell>
                                                <TableCell className="text-center w-1/6">
                                                    {member.registration_payment_reference}
                                                </TableCell>
                                                <TableCell className="text-center w-1/6">
                                                    {member.resubmission_required ? "N/A" : formatAmount(member.outstanding_amount, club?.currency)}
                                                </TableCell>
                                                <TableCell className="text-center w-1/6">
                                                    {
                                                        member.resubmission_required ?
                                                            <div className="flex justify-center items-center">
                                                                <Label className="text-red-500 font-bold">
                                                                    Member resubmission required
                                                                </Label>
                                                            </div> :
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
                                                    }
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
                hashUserId && <SelectedMember selectedMember={selectedMember} setSelectedMember={setSelectedMember} currency={club?.currency ?? "ZAR"} clubAccountId={club?.club_account_id ?? ""} />
            }
        </div>
    );
}