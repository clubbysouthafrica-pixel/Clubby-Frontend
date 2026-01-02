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
import SelectedMember from "@/components/admin/members/members/features/selected-members";
import DeregisterSeasonDialog from "@/components/admin/members/members/features/deregister-season";
import { formatAmount } from "@/data/currencies";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import RegisteredMembersList from "@/components/admin/members/members/registered-members-list";
import PendingMembersList from "@/components/admin/members/members/pending-members-list";
import PreviousMembersList from "@/components/admin/members/members/previous-members-list";
import AddColumnsDialog from "@/components/admin/members/members/features/add-columns-dialog";
import AddFiltersDialog from "@/components/admin/members/members/features/add-filters-dialog";
import {
  filteredRegisteredMembers,
  previousRegisteredMembers,
  pendingRegisteredMembers,
} from "@/helpers/admin/members/filter-members-list";
import { Loader2, X, Download } from "lucide-react";
import { exportTableData } from "@/helpers/admin/members/csv-export";

export default function ListMembersPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext
  ) as ClubContextType;
  const [requestedKeys, setRequestedKeys] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState("registered-members");

  // Map tab value to memberType for API
  const getMemberType = (tab: string): string => {
    switch (tab) {
      case "registered-members":
        return "registered";
      case "pending-members":
        return "pending";
      case "previous-members":
        return "previous";
      default:
        return "registered";
    }
  };

  const { data: clubMembers, isLoading: clubMembersLoading } =
    useFetchClubMembers(
      club?.club_account_id as string,
      requestedKeys.length > 0 ? requestedKeys : undefined,
      getMemberType(selectedTab)
    );
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
  const [memberIdFilter, setMemberIdFilter] = useState("");
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [filterLoading, setFilterLoading] = useState(true);

  const [registeredMembersLength, setRegisteredMembersLength] =
    useState<number>(0);
  const [unregisteredMembersLength, setUnregisteredMembersLength] =
    useState<number>(0);
  const [deregisteredMembersLength, setDeregisteredMembersLength] =
    useState<number>(0);

  const [availableDynamicFilters, setAvailableDynamicFilters] = useState<
    { key: string; field_name: string; type: string; options: string[] }[]
  >([]);
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>([]);
  const [showFilterSelector, setShowFilterSelector] = useState(false);

  const [activeColumnKeysRegistered, setActiveColumnKeysRegistered] = useState<
    string[]
  >([]);
  const [showColumnSelectorRegistered, setShowColumnSelectorRegistered] =
    useState(false);
  const [activeColumnKeysPending, setActiveColumnKeysPending] = useState<
    string[]
  >([]);
  const [showColumnSelectorPending, setShowColumnSelectorPending] =
    useState(false);
  const [activeColumnKeysPrevious, setActiveColumnKeysPrevious] = useState<
    string[]
  >([]);
  const [showColumnSelectorPrevious, setShowColumnSelectorPrevious] =
    useState(false);

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
      memberIdFilter,
      dynamicFilters,
      availableDynamicFilters
    );
    setRegisteredMembersLength(regMembersFiltered.length);

    const prevMembersFiltered = previousRegisteredMembers(
      selectedTab,
      clubMembers,
      memberNameFilter,
      memberIdFilter,
      dynamicFilters,
      availableDynamicFilters
    );
    setDeregisteredMembersLength(prevMembersFiltered.length);

    const pendingMembersFiltered = pendingRegisteredMembers(
      selectedTab,
      clubMembers,
      memberNameFilter,
      memberIdFilter,
      dynamicFilters,
      availableDynamicFilters
    );
    setUnregisteredMembersLength(pendingMembersFiltered.length);
  }, [clubMembers]);

  useEffect(() => {
    setDisplayAmount(formatAmount(0, club?.currency));
  }, [club]);

  useEffect(() => {
    const allKeys = [
      ...new Set([
        ...activeFilterKeys,
        ...activeColumnKeysRegistered,
        ...activeColumnKeysPending,
        ...activeColumnKeysPrevious,
      ]),
    ];

    // Check if there are any new keys not in requestedKeys
    const newKeys = allKeys.filter((key) => !requestedKeys.includes(key));

    if (newKeys.length > 0) {
      // Merge new keys with previously requested keys
      const mergedKeys = [...new Set([...requestedKeys, ...newKeys])];
      setRequestedKeys(mergedKeys);
    } else if (allKeys.length === 0) {
      // If all keys removed, clear requested keys
      setRequestedKeys([]);
    }
  }, [
    activeFilterKeys,
    activeColumnKeysRegistered,
    activeColumnKeysPending,
    activeColumnKeysPrevious,
  ]);

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

  const registerUser = (
    member: ClubMember,
    paymentMethod?: string,
    templateVariables?: Array<{ name: string; value: string }>
  ) => {
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
        payment_method: paymentMethod,
        template_variables: templateVariables,
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
    setMemberIdFilter("");
    setDynamicFilters({});
    setActiveFilterKeys([]);
  };

  const handleDownloadRegisteredMembers = () => {
    const membersToDownload = filteredRegisteredMembers(
      "registered-members",
      clubMembers,
      memberNameFilter,
      memberIdFilter,
      dynamicFilters,
      availableDynamicFilters
    );

    const customCols =
      clubMembers?.filters?.filter((f: any) =>
        activeColumnKeysRegistered.includes(f.key)
      ) || [];

    exportTableData({
      members: membersToDownload,
      tableName: "Active_Members",
      defaultColumns: ["Member Name", "Member ID", "Registered On"],
      customColumns: customCols,
    });
  };

  const handleDownloadPendingMembers = () => {
    const membersToDownload = pendingRegisteredMembers(
      "pending-members",
      clubMembers,
      memberNameFilter,
      memberIdFilter,
      dynamicFilters,
      availableDynamicFilters
    );

    const customCols =
      clubMembers?.filters?.filter((f: any) =>
        activeColumnKeysPending.includes(f.key)
      ) || [];

    exportTableData({
      members: membersToDownload,
      tableName: "Pending_Members",
      defaultColumns: [
        "Member Name",
        "Member ID",
        "Registration Submitted On",
        "Outstanding Amount",
      ],
      customColumns: customCols,
    });
  };

  const handleDownloadPreviousMembers = () => {
    const membersToDownload = previousRegisteredMembers(
      "previous-members",
      clubMembers,
      memberNameFilter,
      memberIdFilter,
      dynamicFilters,
      availableDynamicFilters
    );

    const customCols =
      clubMembers?.filters?.filter((f: any) =>
        activeColumnKeysPrevious.includes(f.key)
      ) || [];

    exportTableData({
      members: membersToDownload,
      tableName: "Previous_Members",
      defaultColumns: ["Member Name", "Member ID", "Deregistered On"],
      customColumns: customCols,
    });
  };

  return (
    <div className="p-5">
      <h1 className="text-base font-bold">Club Members</h1>
      <>
        {clubLoading ? (
          <div className="flex justify-center items-center p-8 min-h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs
            value={selectedTab}
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
              setMemberIdFilter("");
              setDynamicFilters({});

              // Reset custom columns for all tabs
              setActiveColumnKeysRegistered([]);
              setActiveColumnKeysPending([]);
              setActiveColumnKeysPrevious([]);
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
                    <TabsTrigger
                      value="registered-members"
                      className="w-[300px]"
                    >
                      Active Members
                    </TabsTrigger>
                    <TabsTrigger value="pending-members" className="w-[300px]">
                      Members Pending
                    </TabsTrigger>
                    <TabsTrigger value="previous-members" className="w-[300px]">
                      Members Requiring Re-Registration
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
            <div className="flex flex-row flex-wrap gap-2 p-2">
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
              <Input
                placeholder="Filter by member ID"
                value={memberIdFilter}
                onChange={(e) => {
                  setMemberIdFilter(e.target.value);
                  setlistActionItems([]);
                  setDeregisterMembers([]);
                  setAllMembersSelected(false);
                }}
                className="w-[300px]"
              />
            </div>

            {availableDynamicFilters &&
              activeFilterKeys.length > 0 &&
              (() => {
                const activeFilters = availableDynamicFilters.filter(
                  ({ key }) => activeFilterKeys.includes(key)
                );

                const sortedFilters = activeFilters.sort((a, b) => {
                  const getType = (
                    filter: (typeof availableDynamicFilters)[0]
                  ) => {
                    if (!filter.options) return 0;
                    if (
                      filter.options.length === 2 &&
                      filter.options.includes("true") &&
                      filter.options.includes("false")
                    )
                      return 2;
                    return 1;
                  };
                  return getType(a) - getType(b);
                });

                return (
                  <div className="flex flex-col gap-2 p-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Custom Filters
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sortedFilters.map(
                        ({ key, field_name, options, type }) => {
                          // Handle billing:number type with comparison operators
                          if (type === "billing:number") {
                            const filterValue = dynamicFilters[key] || {};
                            const operator =
                              typeof filterValue === "object"
                                ? filterValue.operator || "gte"
                                : "gte";
                            const rawValue =
                              typeof filterValue === "object"
                                ? filterValue.value || ""
                                : "";
                            const displayValue = rawValue
                              ? formatAmount(
                                  parseInt(rawValue) || 0,
                                  club?.currency
                                )
                              : "";

                            return (
                              <div
                                key={key}
                                className="border rounded-lg p-3 bg-white"
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <Label className="text-xs font-semibold">
                                    {field_name}
                                  </Label>
                                  <button
                                    onClick={() => {
                                      setActiveFilterKeys((prev) =>
                                        prev.filter((k) => k !== key)
                                      );
                                      setDynamicFilters((prev) => {
                                        const newFilters = { ...prev };
                                        delete newFilters[key];
                                        return newFilters;
                                      });
                                    }}
                                    className="p-0.5 hover:bg-gray-200 rounded"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <Select
                                    onValueChange={(newOperator) => {
                                      setDynamicFilters((prev) => ({
                                        ...prev,
                                        [key]: {
                                          operator: newOperator,
                                          value: rawValue,
                                        },
                                      }));
                                      setlistActionItems([]);
                                      setDeregisterMembers([]);
                                      setAllMembersSelected(false);
                                    }}
                                    value={operator}
                                  >
                                    <SelectTrigger className="w-[200px] text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="eq">
                                        Equal to
                                      </SelectItem>
                                      <SelectItem value="neq">
                                        Not equal to
                                      </SelectItem>
                                      <SelectItem value="gt">
                                        Greater than
                                      </SelectItem>
                                      <SelectItem value="gte">
                                        Greater or equal
                                      </SelectItem>
                                      <SelectItem value="lt">
                                        Less than
                                      </SelectItem>
                                      <SelectItem value="lte">
                                        Less or equal
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="text"
                                    placeholder="Enter amount"
                                    value={displayValue}
                                    onChange={(e) => {
                                      const inputValue = e.target.value.replace(
                                        /[^\d]/g,
                                        ""
                                      );
                                      const numericValue = inputValue || "";
                                      setDynamicFilters((prev) => ({
                                        ...prev,
                                        [key]: {
                                          operator,
                                          value: numericValue,
                                        },
                                      }));
                                      setlistActionItems([]);
                                      setDeregisterMembers([]);
                                      setAllMembersSelected(false);
                                    }}
                                    className="w-[150px] text-sm"
                                  />
                                </div>
                              </div>
                            );
                          }

                          if (!options) {
                            return (
                              <div
                                key={key}
                                className="border rounded-lg p-3 bg-white"
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <Label className="text-xs font-semibold">
                                    {field_name}
                                  </Label>
                                  <button
                                    onClick={() => {
                                      setActiveFilterKeys((prev) =>
                                        prev.filter((k) => k !== key)
                                      );
                                      setDynamicFilters((prev) => {
                                        const newFilters = { ...prev };
                                        delete newFilters[key];
                                        return newFilters;
                                      });
                                    }}
                                    className="p-0.5 hover:bg-gray-200 rounded"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                <Input
                                  placeholder={`Filter by ${field_name}`}
                                  value={dynamicFilters[key] || ""}
                                  onChange={(e) => {
                                    setDynamicFilters((prev) => ({
                                      ...prev,
                                      [key]: e.target.value,
                                    }));
                                    setlistActionItems([]);
                                    setDeregisterMembers([]);
                                    setAllMembersSelected(false);
                                  }}
                                  className="w-[280px] text-sm"
                                />
                              </div>
                            );
                          }

                          if (
                            options &&
                            options.length === 2 &&
                            options.includes("true") &&
                            options.includes("false")
                          ) {
                            return (
                              <div
                                key={key}
                                className="border rounded-lg p-3 bg-white"
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <Label className="text-xs font-semibold">
                                    {field_name}
                                  </Label>
                                  <button
                                    onClick={() => {
                                      setActiveFilterKeys((prev) =>
                                        prev.filter((k) => k !== key)
                                      );
                                      setDynamicFilters((prev) => {
                                        const newFilters = { ...prev };
                                        delete newFilters[key];
                                        return newFilters;
                                      });
                                    }}
                                    className="p-0.5 hover:bg-gray-200 rounded"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                <Checkbox
                                  id={key}
                                  checked={dynamicFilters[key] === "true"}
                                  onCheckedChange={(checked) => {
                                    setDynamicFilters((prev) => ({
                                      ...prev,
                                      [key]: checked ? "true" : "",
                                    }));
                                    setlistActionItems([]);
                                    setDeregisterMembers([]);
                                    setAllMembersSelected(false);
                                  }}
                                />
                                <label
                                  htmlFor={key}
                                  className="text-sm font-medium cursor-pointer ml-2"
                                >
                                  Enabled
                                </label>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={key}
                              className="border rounded-lg p-3 bg-white"
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <Label className="text-xs font-semibold">
                                  {field_name}
                                </Label>
                                <button
                                  onClick={() => {
                                    setActiveFilterKeys((prev) =>
                                      prev.filter((k) => k !== key)
                                    );
                                    setDynamicFilters((prev) => {
                                      const newFilters = { ...prev };
                                      delete newFilters[key];
                                      return newFilters;
                                    });
                                  }}
                                  className="p-0.5 hover:bg-gray-200 rounded"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <Select
                                onValueChange={(value) => {
                                  setDynamicFilters((prev) => ({
                                    ...prev,
                                    [key]: value,
                                  }));
                                  setlistActionItems([]);
                                  setDeregisterMembers([]);
                                  setAllMembersSelected(false);
                                }}
                                value={dynamicFilters[key] || ""}
                              >
                                <SelectTrigger className="w-[280px] text-sm">
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
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              })()}
            <div className="flex gap-2 p-2 justify-between items-center">
              <AddFiltersDialog
                open={showFilterSelector}
                onOpenChange={setShowFilterSelector}
                availableFields={availableDynamicFilters}
                activeFilterKeys={activeFilterKeys}
                onFilterKeysChange={setActiveFilterKeys}
              />
              {selectedTab === "registered-members" &&
                import.meta.env.VITE_ENVIRONMENT === "Dev" && (
                  <AddColumnsDialog
                    open={showColumnSelectorRegistered}
                    onOpenChange={setShowColumnSelectorRegistered}
                    availableFields={availableDynamicFilters}
                    activeColumnKeys={activeColumnKeysRegistered}
                    onColumnKeysChange={setActiveColumnKeysRegistered}
                  />
                )}
              {selectedTab === "pending-members" &&
                import.meta.env.VITE_ENVIRONMENT === "Dev" && (
                  <AddColumnsDialog
                    open={showColumnSelectorPending}
                    onOpenChange={setShowColumnSelectorPending}
                    availableFields={availableDynamicFilters}
                    activeColumnKeys={activeColumnKeysPending}
                    onColumnKeysChange={setActiveColumnKeysPending}
                  />
                )}
              {selectedTab === "previous-members" &&
                import.meta.env.VITE_ENVIRONMENT === "Dev" && (
                  <AddColumnsDialog
                    open={showColumnSelectorPrevious}
                    onOpenChange={setShowColumnSelectorPrevious}
                    availableFields={availableDynamicFilters}
                    activeColumnKeys={activeColumnKeysPrevious}
                    onColumnKeysChange={setActiveColumnKeysPrevious}
                  />
                )}
            </div>
            <TabsContent
              value="registered-members"
              className="relative flex flex-col gap-4 overflow-auto"
            >
              <div className="flex items-center gap-2">
                <h2 className="px-2 text-sm font-semibold">Active Members</h2>
                <Badge variant="secondary">{registeredMembersLength}</Badge>
              </div>              {clubMembersLoading || filterLoading ? (
                <div className="flex justify-center items-center p-8 min-h-96">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (              <div className="flex flex-col">
                <RegisteredMembersList
                  clubId={club?.club_account_id || ""}
                  sensors={sensors}
                  sortableId={sortableId}
                  allMembersSelected={allMembersSelected}
                  listActionItems={listActionItems}
                  selectedTab={selectedTab}
                  clubMembers={clubMembers}
                  memberNameFilter={memberNameFilter}
                  memberIdFilter={memberIdFilter}
                  dynamicFilters={dynamicFilters}
                  activeColumnKeys={activeColumnKeysRegistered}
                  dereigsterMembers={dereigsterMembers}
                  setAllListActionItems={setAllListActionItems}
                  setSelectedMember={setSelectedMember}
                  setlistActionItems={setlistActionItems}
                  setDeregisterMembers={setDeregisterMembers}
                  setAllMembersSelected={setAllMembersSelected}
                  setRegisteredMembersLength={setRegisteredMembersLength}
                />
                <button
                  onClick={handleDownloadRegisteredMembers}
                  className="mt-4 p-2 w-fit bg-transparent cursor-pointer hover:bg-gray-100 transition rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title="Download table data as CSV"
                >
                  <Download className="h-5 w-5 text-green-600" />
                </button>
              </div>
              )}
            </TabsContent>

            <TabsContent
              value="pending-members"
              className="relative flex flex-col gap-4 overflow-auto"
            >
              <div className="flex items-center gap-2">
                <h2 className="px-2 text-sm font-semibold">Members Pending</h2>
                <Badge variant="secondary">{unregisteredMembersLength}</Badge>
              </div>              {clubMembersLoading || filterLoading ? (
                <div className="flex justify-center items-center p-8 min-h-96">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (              <div className="flex flex-col">
                <PendingMembersList
                  clubId={club?.club_account_id || ""}
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
                  memberIdFilter={memberIdFilter}
                  dynamicFilters={dynamicFilters}
                  allMembersSelected={allMembersSelected}
                  activeColumnKeys={activeColumnKeysPending}
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
                <button
                  onClick={handleDownloadPendingMembers}
                  className="mt-4 p-2 w-fit bg-transparent cursor-pointer hover:bg-gray-100 transition rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title="Download table data as CSV"
                >
                  <Download className="h-5 w-5 text-green-600" />
                </button>
              </div>
              )}
            </TabsContent>

            <TabsContent
              value="previous-members"
              className="relative flex flex-col gap-4 overflow-auto"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Members Requiring Re-Registration</h2>
                <Badge variant="secondary">{deregisteredMembersLength}</Badge>
              </div>
              {clubMembersLoading || filterLoading ? (
                <div className="flex justify-center items-center p-8 min-h-96">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
              <div className="flex flex-col">
                <PreviousMembersList
                  clubId={club?.club_account_id || ""}
                  club={club}
                  sensors={sensors}
                  sortableId={sortableId}
                  selectedTab={selectedTab}
                  clubMembers={clubMembers}
                  allMembersSelected={allMembersSelected}
                  memberNameFilter={memberNameFilter}
                  memberIdFilter={memberIdFilter}
                  dynamicFilters={dynamicFilters}
                  listActionItems={listActionItems}
                  activeColumnKeys={activeColumnKeysPrevious}
                  setAllListActionItems={setAllListActionItems}
                  setSelectedMember={setSelectedMember}
                  setlistActionItems={setlistActionItems}
                  setAllMembersSelected={setAllMembersSelected}
                  setDeregisteredMembersLength={setDeregisteredMembersLength}
                />
                <button
                  onClick={handleDownloadPreviousMembers}
                  className="mt-4 p-2 w-fit bg-transparent cursor-pointer hover:bg-gray-100 transition rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title="Download table data as CSV"
                >
                  <Download className="h-5 w-5 text-green-600" />
                </button>
              </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </>
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
