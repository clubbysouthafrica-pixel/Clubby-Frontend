import React, { useContext, useEffect, useState } from "react";
import { useFetchClubMembers } from "@/queries/admin/club-members";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ClubMember } from "@/interfaces/club";
import { useRegisterUserToClubMutation } from "@/mutations/admin/member";
import SendEmailDialog from "@/components/admin/members/members/send-email";
import DeregisterMembersDialog from "@/components/admin/members/members/deregister-members";
import SelectedMember from "@/components/admin/members/members/selected-members";
import DeregisterSeasonDialog from "@/components/admin/members/members/deregister-season";
import { formatAmount } from "@/data/currencies";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RegisteredMembersList from "@/components/admin/members/members/registered-members-list";
import PendingMembersList from "@/components/admin/members/members/pending-members-list";
import PreviousMembersList from "@/components/admin/members/members/previous-members-list";
import {
  filteredRegisteredMembers,
  previousRegisteredMembers,
  pendingRegisteredMembers,
} from "@/helpers/admin/members/filter-members-list";
import { Loader2 } from "lucide-react";

export default function ListMembersPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const { data: clubMembers, isLoading: clubMembersLoading } =
    useFetchClubMembers(club?.club_account_id as string);
  const { mutate, isPending, isSuccess, isError, reset } =
    useRegisterUserToClubMutation();
  const [listActionItems, setlistActionItems] = useState<
    { email: string; name: string }[]
  >([]);
  const [allMembersSelected, setAllMembersSelected] = useState(false);
  const [openDialogUserId, setOpenDialogUserId] = useState<string | null>(null);
  const [dereigsterMembers, setDeregisterMembers] = useState<
    { user_id: string; name: string }[]
  >([]);
  const [hashUserId, setHashUserId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState({});
  const [memberRegisterAmount, setMemberRegisterAmount] = useState<number>(0);
  const [displayAmount, setDisplayAmount] = useState<string>(
    formatAmount(0, club?.currency)
  );
  const [invalidRegistrationAmount, setInvalidRegistrationAmount] =
    useState(false);
  const [memberNameFilter, setMemberNameFilter] = useState("");
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>(
    {}
  );
  const [filterLoading, setFilterLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("registered-members");

  const [registeredMembersLength, setRegisteredMembersLength] =
    useState<number>(0);
  const [unregisteredMembersLength, setUnregisteredMembersLength] =
    useState<number>(0);
  const [deregisteredMembersLength, setDeregisteredMembersLength] =
    useState<number>(0);

  const [availableDynamicFilters, setAvailableDynamicFilters] = useState<
    { key: string; field_name: string; type: string; options: string[] }[]
  >([]);

  const handleFormattedInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInvalidRegistrationAmount(false);
    const inputValue = e.target.value.replace(/[^\d]/g, "");
    const numericValue = parseInt(inputValue || "0", 10);

    setMemberRegisterAmount(numericValue);
    setDisplayAmount(formatAmount(numericValue, club?.currency));
  };

  const sortableId = React.useId();

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const setAllListActionItems = (members: ClubMember[]) => {
    if (allMembersSelected) {
      setlistActionItems([]);
      setDeregisterMembers([]);
      setAllMembersSelected(false);
    } else {
      const allMembers = members.map((member: ClubMember) => {
        return {
          email: member.member_email as string,
          name: `${member.member_first_name} ${member.member_surname}`,
        };
      });
      const allDeregisterMembers = members.map((member: ClubMember) => {
        return {
          user_id: member.user_id,
          name: `${member.member_first_name} ${member.member_surname}`,
        };
      });
      setlistActionItems(allMembers);
      setAllMembersSelected(true);
      setDeregisterMembers(allDeregisterMembers);
    }
  };

  useEffect(() => {
    if (!clubMembers?.registered && !clubMembers?.unregistered) return;

    setAvailableDynamicFilters(clubMembers?.filters);
    setFilterLoading(false);

    const regMembersFiltered = filteredRegisteredMembers(
      selectedTab,
      clubMembers,
      memberNameFilter,
      dynamicFilters
    );
    setRegisteredMembersLength(regMembersFiltered.length);

    const prevMembersFiltered = previousRegisteredMembers(
      selectedTab,
      clubMembers,
      memberNameFilter,
      dynamicFilters
    );
    setDeregisteredMembersLength(prevMembersFiltered.length);

    const pendingMembersFiltered = pendingRegisteredMembers(
      selectedTab,
      clubMembers,
      memberNameFilter,
      dynamicFilters
    );
    setUnregisteredMembersLength(pendingMembersFiltered.length);
  }, [clubMembers]);

  useEffect(() => {
    setDisplayAmount(formatAmount(0, club?.currency));
  }, [club]);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

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
    if (
      memberRegisterAmount > member.outstanding_amount ||
      (memberRegisterAmount == 0 && member.outstanding_amount > 0) || 
      memberRegisterAmount < 0
    ) {
      setInvalidRegistrationAmount(true);
      return;
    }

    mutate(
      {
        clubId: club?.club_account_id as string,
        userId: member.user_id,
        payment_amount: memberRegisterAmount,
      },
      {
        onSuccess: (response: any) => {
          if (!response.registered) {
            clubMembers.unregistered.forEach((m: any) => {
              if (m.user_id === member.user_id) {
                m.outstanding_amount -= memberRegisterAmount;
              }
            });
          } else {
            window.location.reload();
          }
          setMemberRegisterAmount(0);
        },
      }
    );
  };

  useEffect(() => {
    if (isSuccess) {
      setOpenDialogUserId(null);
    }
  }, [isSuccess]);

  const resetFilters = () => {
    setMemberNameFilter("");
    setDynamicFilters({});
  };

  if (clubMembersLoading || filterLoading) {
    return (
      <div className="p-5 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5">
      <h1 className="text-base font-bold">Club Members</h1>
      {!clubMembersLoading && !filterLoading && (
        <Tabs
          defaultValue="registered-members"
          onValueChange={(value: string) => {
            setSelectedTab(value);
            setHashUserId(null);
            setlistActionItems([]);
            setDeregisterMembers([]);
            setAllMembersSelected(false);
            setSelectedMember({});
            window.history.pushState(
              "",
              document.title,
              window.location.pathname + window.location.search
            );

            setMemberNameFilter("");
            setDynamicFilters({});
          }}
          className="w-full flex-col justify-start gap-1 mt-2"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="view-selector" className="sr-only">
              View
            </Label>
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <TabsList className="m-w-90%">
                  <TabsTrigger value="registered-members" className="w-[300px]">
                    Active Members {" "}
                    <Badge variant="secondary">{registeredMembersLength}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending-members" className="w-[300px]">
                    Members Pending {" "}
                    <Badge variant="secondary">{unregisteredMembersLength}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="previous-members" className="w-[300px]">
                    Members Requiring Re-Registration {" "}
                    <Badge variant="secondary">{deregisteredMembersLength}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="ml-4 flex-shrink-0">
                <DeregisterSeasonDialog
                  clubId={club?.club_account_id ?? ""}
                />
              </div>
            </div>
          </div>
          <p
            className="px-2 mt-3 text-blue-600 underline cursor-pointer"
            onClick={resetFilters}
          >
            Reset filters
          </p>
          <div className="flex flex-wrap justify-between gap-4">
            <div className="flex flex-wrap gap-3 flex-1 min-w-[300px]">
              <Input
                placeholder="Filter by member name"
                value={memberNameFilter}
                onChange={(e) => {
                  setMemberNameFilter(e.target.value);
                  setlistActionItems([]);
                  setDeregisterMembers([]);
                  setAllMembersSelected(false);
                }}
                className="w-[300px]"
              />
              {availableDynamicFilters &&
                availableDynamicFilters.map(({ key, field_name, options }) => (
                  <Select
                    key={key}
                    onValueChange={(value) => {
                      setDynamicFilters((prev) => ({ ...prev, [key]: value }));
                      setlistActionItems([]);
                      setDeregisterMembers([]);
                      setAllMembersSelected(false);
                    }}
                    value={dynamicFilters[key] || ""}
                  >
                    <SelectTrigger className="w-[250px]">
                      <span className="text-muted-foreground">
                        {field_name}:
                      </span>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
            </div>
            <div className="px-2 py-1 flex items-center gap-4">
              {club?.club_account_id && (
                <SendEmailDialog
                  clubId={club.club_account_id}
                  contacts={listActionItems}
                  setlistActionItems={setlistActionItems}
                  setDeregisterMembers={setDeregisterMembers}
                  setAllMembersSelected={setAllMembersSelected}
                />
              )}
              {club?.club_account_id &&
                selectedTab === "registered-members" && (
                  <DeregisterMembersDialog
                    dereigsterMembers={dereigsterMembers}
                    clubId={club.club_account_id}
                    setlistActionItems={setlistActionItems}
                    setDeregisterMembers={setDeregisterMembers}
                    setAllMembersSelected={setAllMembersSelected}
                    selectedTab={selectedTab}
                  />
                )}
            </div>
          </div>
          <TabsContent
            value="registered-members"
            className="relative flex flex-col gap-4 overflow-auto"
          >
            <RegisteredMembersList
              sensors={sensors}
              sortableId={sortableId}
              allMembersSelected={allMembersSelected}
              listActionItems={listActionItems}
              selectedTab={selectedTab}
              clubMembers={clubMembers}
              memberNameFilter={memberNameFilter}
              dynamicFilters={dynamicFilters}
              dereigsterMembers={dereigsterMembers}
              setAllListActionItems={setAllListActionItems}
              setSelectedMember={setSelectedMember}
              setlistActionItems={setlistActionItems}
              setDeregisterMembers={setDeregisterMembers}
              setAllMembersSelected={setAllMembersSelected}
              setRegisteredMembersLength={setRegisteredMembersLength}
            />
          </TabsContent>

          <TabsContent
            value="pending-members"
            className="relative flex flex-col gap-4 overflow-auto"
          >
            <PendingMembersList
              club={club}
              sensors={sensors}
              sortableId={sortableId}
              openDialogUserId={openDialogUserId}
              displayAmount={displayAmount}
              isPending={isPending}
              invalidRegistrationAmount={invalidRegistrationAmount}
              isError={isError}
              reset={reset}
              selectedTab={selectedTab}
              clubMembers={clubMembers}
              listActionItems={listActionItems}
              memberNameFilter={memberNameFilter}
              dynamicFilters={dynamicFilters}
              allMembersSelected={allMembersSelected}
              handleFormattedInputChange={handleFormattedInputChange}
              registerUser={registerUser}
              setlistActionItems={setlistActionItems}
              setSelectedMember={setSelectedMember}
              setOpenDialogUserId={setOpenDialogUserId}
              setMemberRegisterAmount={setMemberRegisterAmount}
              setUnregisteredMembersLength={setUnregisteredMembersLength}
              setAllListActionItems={setAllListActionItems}
              setAllMembersSelected={setAllMembersSelected}
            />
          </TabsContent>

          <TabsContent
            value="previous-members"
            className="relative flex flex-col gap-4 overflow-auto"
          >
            <PreviousMembersList
              club={club}
              sensors={sensors}
              sortableId={sortableId}
              selectedTab={selectedTab}
              clubMembers={clubMembers}
              allMembersSelected={allMembersSelected}
              memberNameFilter={memberNameFilter}
              dynamicFilters={dynamicFilters}
              listActionItems={listActionItems}
              setAllListActionItems={setAllListActionItems}
              setSelectedMember={setSelectedMember}
              setlistActionItems={setlistActionItems}
              setAllMembersSelected={setAllMembersSelected}
              setDeregisteredMembersLength={setDeregisteredMembersLength}
            />
          </TabsContent>
        </Tabs>
      )}
      {hashUserId && (
        <SelectedMember
          clubName={club?.club_name ?? ""}
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
          currency={club?.currency ?? "ZAR"}
          clubAccountId={club?.club_account_id ?? ""}
        />
      )}
    </div>
  );
}
