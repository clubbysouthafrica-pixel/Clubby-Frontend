import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useFetchMemberRegisteration } from "@/queries/admin/registration-form";
import {
  Loader2,
  Edit,
  Trash2,
  Copy,
  PencilIcon,
  CalendarClock,
  FileText,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import {
  updateAdminNotes,
  removeAdminNotes,
  fetchRegistrationField,
  updateRegistrationField,
} from "@/services/admin/registration-form";
import { updateMemberVariable } from "@/services/admin/club-members";
import { toast } from "sonner";
import {
  validateFieldValue,
  getStandardFieldType,
  FieldMetadata,
} from "@/utils/fieldValidation";
import { countryCodes, getDialingCode } from "@/data/country-codes";
import { Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatEpoch(epoch: number) {
  const date = new Date(epoch);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

function formatVariableName(name: string): string {
  return name
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function parseBooleanLikeValue(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "true" || normalizedValue === "yes") {
    return true;
  }

  if (normalizedValue === "false" || normalizedValue === "no") {
    return false;
  }

  return null;
}

type RegistrationPageField = {
  visible?: boolean;
  value?: string | null;
};

type RegistrationPage = {
  fields: RegistrationPageField[];
  page_header?: string;
};

export function CurrentMemberRegistration({
  userId,
  clubAccountId,
  currency,
  clubName,
  missingMember,
  registrationId,
}: {
  userId: string;
  clubAccountId: string;
  currency: string;
  clubName: string;
  missingMember: boolean;
  registrationId?: string;
}) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState<
    Array<{ id: string; title: string; content: string; visibleToMember: boolean }>
  >([]);
  const [isAdminNotesOpen, setIsAdminNotesOpen] = useState(false);
  const [isVariablesOpen, setIsVariablesOpen] = useState(false);
  const [editingVariableIndex, setEditingVariableIndex] = useState<number | null>(null);
  const [editVariableValue, setEditVariableValue] = useState<string>("");
  const [isSavingVariable, setIsSavingVariable] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteVisibleToMember, setNoteVisibleToMember] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("ZA");
  const [updatedFieldValues, setUpdatedFieldValues] = useState<
    Record<string, string>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [loadingFieldId, setLoadingFieldId] = useState<string | null>(null);
  const [fieldMetadata, setFieldMetadata] = useState<
    Record<string, FieldMetadata>
  >({});

  const { data, isLoading } = useFetchMemberRegisteration(
    clubAccountId,
    userId,
    currency,
    missingMember ? registrationId : undefined
  );

  const updateNotesMutation = useMutation({
    mutationFn: (
      notes: Array<{ id: string; title: string; content: string; visibleToMember: boolean }>
    ) => updateAdminNotes(data.registration_id, data.member_id, notes),
    onSuccess: (_, newNotes) => {
      setAdminNotes(newNotes);
      setNoteTitle("");
      setNoteContent("");
      setNoteVisibleToMember(false);
      toast.success("Admin notes updated successfully");
    },
    onError: () => {
      toast.error("Failed to update admin notes");
    },
  });

  const removeNotesMutation = useMutation({
    mutationFn: (noteIds: string[]) =>
      removeAdminNotes(data.member_id, data.registration_id, noteIds),
    onSuccess: (_, noteIds) => {
      setAdminNotes(adminNotes.filter((note) => !noteIds.includes(note.id)));
      toast.success("Admin note removed successfully");
    },
    onError: () => {
      toast.error("Failed to remove admin note");
    },
  });



  useEffect(() => {
    if (data?.admin_notes && Array.isArray(data.admin_notes)) {
      const notesWithVisibility = data.admin_notes.map(
        (note: { id: string; title: string; content: string; visibleToMember?: boolean }) => ({
          ...note,
          visibleToMember: note.visibleToMember ?? false,
        })
      );
      setAdminNotes(notesWithVisibility);
    }
  }, [data?.admin_notes]);

  // Filter pages to only show pages with at least one visible field
  const visiblePages = data?.pages?.filter((page: RegistrationPage) =>
    page.fields.some(
      (field: RegistrationPageField) =>
        !(field.visible === false && !field.value)
    )
  ) || [];

  const registrationStatus = data?.deregistered_on
    ? {
        label: "De-registered",
        className: "border-rose-200 bg-rose-50 text-rose-700",
        helper: "This registration is no longer active.",
      }
    : data?.registered_on
      ? {
          label: "Registered",
          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
          helper: "This registration has been approved and activated.",
        }
      : {
          label: "Pending review",
          className: "border-amber-200 bg-amber-50 text-amber-700",
          helper: "Review the submitted details and update any admin-only values before approval.",
        };
  const registrationTone = data?.deregistered_on
    ? {
        badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
        panelClassName: "border-rose-200 bg-rose-50/80 text-rose-900",
      }
    : data?.registered_on
      ? {
          badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
          panelClassName: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
        }
      : {
          badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
          panelClassName: "border-amber-200 bg-amber-50/80 text-amber-900",
        };
  const showRegistrationTags = Boolean(data?.registered_on && !data?.deregistered_on);
  const currentPage = visiblePages[currentPageIndex];

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-slate-200 bg-white/80 p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Loading registration details...</p>
        </div>
      </div>
    );
  }

  if (visiblePages.length === 0) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          No registration fields are available for this member.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="space-y-4 xl:sticky xl:top-24">
          <Card className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)]">
            <CardHeader className="space-y-4 border-b border-slate-200 bg-slate-50/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-950">Registration summary</CardTitle>
                  <CardDescription className="mt-1 text-sm text-slate-500">
                    This admin view mirrors the submitted member registration while keeping field editing available.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Club
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{clubName}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {registrationStatus.helper}
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <CalendarClock className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold">Registration timeline</p>
                </div>
                <div className="space-y-2 text-sm">
                  {data?.registration_submitted_on ? (
                    <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className="text-slate-500">Submitted</span>
                      <strong className="text-right text-slate-900">
                        {formatEpoch(data.registration_submitted_on)}
                      </strong>
                    </div>
                  ) : null}
                  {data?.registered_on ? (
                    <div className="flex items-start justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2.5">
                      <span className="text-emerald-700">Registered</span>
                      <strong className="text-right text-emerald-800">
                        {formatEpoch(data.registered_on)}
                      </strong>
                    </div>
                  ) : null}
                  {data?.deregistered_on ? (
                    <div className="flex items-start justify-between gap-3 rounded-xl bg-rose-50 px-3 py-2.5">
                      <span className="text-rose-700">De-registered</span>
                      <strong className="text-right text-rose-800">
                        {formatEpoch(data.deregistered_on)}
                      </strong>
                    </div>
                  ) : null}
                </div>
              </div>

              {(userId || data?.transaction_id) && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-semibold">Identifiers</p>
                  </div>
                  {userId ? (
                    <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Member ID</p>
                        <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-950">{userId}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(userId);
                        }}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                        title="Copy member ID"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                  {data?.transaction_id ? (
                    <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Transaction ID</p>
                        <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-950">{data.transaction_id}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(data.transaction_id);
                        }}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                        title="Copy transaction ID"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

            </CardContent>
          </Card>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="overflow-hidden border-none bg-white/90 shadow-none">
            <CardContent className="px-0 py-0">
              <div className="flex flex-col gap-10 justify-center items-center px-3 lg:px-4 w-full overflow-x-hidden bg-gradient-to-b from-gray-50 to-white py-4 lg:py-6 rounded-[28px] border border-slate-200 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)]">
                <div className="w-full max-w-3xl mb-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-md">
                  <div className="px-6 py-6 lg:px-10 lg:py-8 overflow-x-hidden">
                    <div
                      className={cn(
                        "mb-6 rounded-2xl border px-4 py-4 sm:px-5 sm:py-4",
                        registrationTone.panelClassName
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">Current registration status</p>
                          <p className="mt-1 text-sm leading-6 opacity-90">
                            {registrationStatus.helper}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-left sm:min-w-[220px]">
                          <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">Pages</p>
                            <p className="mt-1 text-lg font-semibold">{visiblePages.length}</p>
                          </div>
                          <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">Notes</p>
                            <p className="mt-1 text-lg font-semibold">{adminNotes.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {showRegistrationTags ? (
                      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
                        <Badge
                          variant="outline"
                          className={cn("rounded-full border px-3 py-1 text-xs font-semibold", registrationTone.badgeClassName)}
                        >
                          {registrationStatus.label}
                        </Badge>
                        {data?.last_season_registration ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                          >
                            Previous season
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mb-6 space-y-4">
                      <section className="rounded-2xl border border-amber-200 bg-amber-50/60">
                        <button
                          type="button"
                          onClick={() => setIsAdminNotesOpen((currentValue) => !currentValue)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
                        >
                          <div className="flex items-center gap-2 text-amber-950">
                            <AlertCircle className="h-4 w-4 text-amber-700" />
                            <div>
                              <p className="text-sm font-semibold">Admin notes</p>
                              <p className="mt-1 text-xs text-amber-900/70">
                                Internal notes saved against this registration.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 rounded-full border-amber-200 bg-white text-amber-800 hover:bg-amber-100"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <Edit className="h-4 w-4" />
                                  Add note
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Add admin note</DialogTitle>
                                  <DialogDescription>
                                    Save internal notes for this registration and optionally mark them as visible to the member.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="note-title">Note title</Label>
                                    <Input
                                      id="note-title"
                                      placeholder="Payment follow-up, medical note, document check..."
                                      value={noteTitle}
                                      onChange={(e) => setNoteTitle(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="note-content">Note content</Label>
                                    <Textarea
                                      id="note-content"
                                      placeholder="Enter the note details here..."
                                      className="min-h-[200px]"
                                      value={noteContent}
                                      onChange={(e) => setNoteContent(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="visible-to-member"
                                      checked={noteVisibleToMember}
                                      onCheckedChange={(checked) =>
                                        setNoteVisibleToMember(checked as boolean)
                                      }
                                    />
                                    <Label htmlFor="visible-to-member" className="cursor-pointer font-normal">
                                      Visible to member
                                    </Label>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      if (noteTitle.trim() && noteContent.trim()) {
                                        const id = `note-${Date.now()}-${Math.random()
                                          .toString(36)
                                          .substr(2, 9)}`;
                                        const newNotes = [
                                          ...adminNotes,
                                          {
                                            id,
                                            title: noteTitle,
                                            content: noteContent,
                                            visibleToMember: noteVisibleToMember,
                                          },
                                        ];
                                        updateNotesMutation.mutate(newNotes);
                                        setNoteTitle("");
                                        setNoteContent("");
                                        setNoteVisibleToMember(false);
                                      }
                                    }}
                                    disabled={updateNotesMutation.isPending}
                                    className="w-full"
                                  >
                                    {updateNotesMutation.isPending ? "Saving..." : "Save note"}
                                  </Button>
                                  <Button
                                    onClick={() => setIsEditDialogOpen(false)}
                                    variant="outline"
                                    className="w-full"
                                  >
                                    Done
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 text-amber-700 transition-transform",
                                isAdminNotesOpen ? "rotate-180" : "rotate-0"
                              )}
                            />
                          </div>
                        </button>

                        {isAdminNotesOpen ? (
                          adminNotes.length > 0 ? (
                            <div className="space-y-3 border-t border-amber-200 px-4 py-4 sm:px-5">
                              {adminNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className="rounded-xl border border-amber-200 bg-white/80 px-4 py-3 shadow-sm"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <p className="text-sm font-semibold text-amber-950">{note.title}</p>
                                      {note.visibleToMember ? (
                                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
                                          Visible to member
                                        </Badge>
                                      ) : null}
                                      <p className="text-sm leading-6 text-amber-900/85 whitespace-pre-wrap">
                                        {note.content}
                                      </p>
                                    </div>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() => removeNotesMutation.mutate([note.id])}
                                            disabled={removeNotesMutation.isPending}
                                            className="rounded-full p-2 text-red-600 transition hover:bg-amber-100"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">Delete this note</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="border-t border-amber-200 px-4 py-4 sm:px-5">
                              <div className="rounded-2xl border border-dashed border-amber-200 bg-white px-4 py-5 text-center text-sm text-amber-900/70">
                                No admin notes have been added yet.
                              </div>
                            </div>
                          )
                        ) : null}
                      </section>

                      {showRegistrationTags && data?.variables && data.variables.length > 0 && (
                        <section className="rounded-2xl border border-slate-200 bg-slate-50/70">
                          <button
                            onClick={() => setIsVariablesOpen(!isVariablesOpen)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Club tags</p>
                              <p className="mt-1 text-sm text-slate-500">
                                Club tags captured alongside the registration.
                              </p>
                            </div>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 text-slate-500 transition-transform",
                                isVariablesOpen ? "rotate-180" : "rotate-0"
                              )}
                            />
                          </button>
                          {isVariablesOpen && (
                            <div className="grid gap-2.5 border-t border-slate-200 px-4 py-4 sm:grid-cols-2 sm:px-5">
                              {data.variables.map(
                                (variable: { name: string; value: string | number | boolean | null | undefined }, index: number) => {
                                  const isEditing = editingVariableIndex === index;

                                  const handleEdit = () => {
                                    setEditingVariableIndex(index);
                                    setEditVariableValue(variable.value?.toString() || "");
                                  };

                                  const handleSave = async () => {
                                    setIsSavingVariable(true);
                                    try {
                                      await updateMemberVariable(
                                        clubAccountId,
                                        userId,
                                        variable.name,
                                        editVariableValue
                                      );

                                      toast.success(`${formatVariableName(variable.name)} updated successfully`, {
                                        duration: 3000,
                                      });

                                      variable.value = editVariableValue;
                                      setEditingVariableIndex(null);
                                    } catch (error) {
                                      console.error("Error updating variable:", error);
                                      toast.error("Failed to update variable", {
                                        duration: 3000,
                                      });
                                    } finally {
                                      setIsSavingVariable(false);
                                    }
                                  };

                                  const handleCancel = () => {
                                    setEditingVariableIndex(null);
                                    setEditVariableValue("");
                                  };

                                  return (
                                    <div key={index} className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                      <div className="flex flex-1 flex-row gap-2 rounded-lg bg-transparent">
                                        <Label className="w-fit whitespace-nowrap text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                          {formatVariableName(variable.name)}:
                                        </Label>
                                        {isEditing ? (
                                          <Input
                                            autoFocus
                                            value={editVariableValue}
                                            onChange={(e) => setEditVariableValue(e.target.value)}
                                            className="text-sm"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                handleSave();
                                              } else if (e.key === "Escape") {
                                                handleCancel();
                                              }
                                            }}
                                          />
                                        ) : (
                                          <p className="text-sm leading-6 text-slate-700">
                                            {String(variable.value ?? "").trim() || "Does not exist for this member"}
                                          </p>
                                        )}
                                      </div>
                                      <div className="ml-2 flex gap-1 opacity-30 transition-opacity group-hover:opacity-100">
                                        {isEditing ? (
                                          <>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={handleSave}
                                              disabled={isSavingVariable}
                                              className="h-8 w-8 p-0"
                                              title="Save"
                                            >
                                              <Check className="h-4 w-4 text-green-600" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={handleCancel}
                                              disabled={isSavingVariable}
                                              className="h-8 w-8 p-0"
                                              title="Cancel"
                                            >
                                              <X className="h-4 w-4 text-red-600" />
                                            </Button>
                                          </>
                                        ) : (
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleEdit}
                                            className="h-8 w-8 p-0"
                                            title="Update this variable"
                                          >
                                            <PencilIcon className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </section>
                      )}
                    </div>

                    <div
                      key={currentPage?.page_header ?? currentPageIndex}
                      className="flex min-h-0 flex-col"
                    >
                      <div className="mb-8 border-b border-slate-200 pb-6">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
                          <div>
                            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Submitted registration form
                            </CardDescription>
                            <CardTitle className="mt-1.5 text-xl font-bold text-slate-950 sm:mt-2 sm:text-2xl">
                              {currentPage?.page_header}
                            </CardTitle>
                          </div>
                          {visiblePages.length > 1 ? (
                            <div className="text-sm text-slate-500">
                              Page {currentPageIndex + 1} of {visiblePages.length}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 space-y-6 overflow-y-auto">
              {currentPage?.fields.map(
                (field: {
                  type: string;
                  label: string;
                  value: string;
                  input_type?: string;
                  field_id?: string;
                  signature_type?: string;
                  quantity?: number;
                  discount?: number;
                  visible?: boolean;
                }) => {
                  // Hide fields that were removed from the form and have no value for this user
                  if (field.visible === false && !field.value) {
                    return null;
                  }

                  if (field.type === "STANDARD_SIGNATURE") {
                    if (field.signature_type === "signature") {
                      return (
                        <div
                          key={field.label}
                            className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {field.label}
                            </Label>
                            {field.visible === false && (
                              <Badge className="border-orange-200 bg-orange-50 text-orange-700">
                                Removed from registration form
                              </Badge>
                            )}
                          </div>
                          <img
                            src={field.value}
                            alt="User Signature"
                            className="max-w-xs border-b-2 border-slate-400 pb-2"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={field.label}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {field.label}
                            </Label>
                            {field.visible === false && (
                              <Badge className="border-orange-200 bg-orange-50 text-orange-700">
                                Removed from registration form
                              </Badge>
                            )}
                          </div>
                          <Label className="border-b-2 border-slate-400 pb-2 text-lg font-[cursive] text-slate-700">
                            {field.value}
                          </Label>
                        </div>
                      );
                    }
                  }

                  if (field.type === "STANDARD_OTHER") {
                    const isEditing = editingFieldId === field.label;
                    const displayValue = isEditing
                      ? editValue
                      : updatedFieldValues[field.label] ?? field.value;
                    const metadata = fieldMetadata[field.label];

                    const handleSave = async () => {
                      setIsSaving(true);
                      try {
                        const fieldType = metadata?.input_type || "TEXT";
                        const isPhoneNumber = metadata?.phone_number_input === true;

                        // Validate required fields
                        const validationError = validateFieldValue(
                          field.label,
                          editValue,
                          metadata
                        );
                        if (validationError) {
                          toast.error(validationError, {
                            duration: 3000,
                          });
                          setIsSaving(false);
                          return;
                        }

                        const typeParam = getStandardFieldType(fieldType);
                        
                        // For phone numbers, prepend the country dialing code
                        let valueToSave = editValue;
                        if (isPhoneNumber) {
                          // Allow clearing the phone number if field is not required
                          if (editValue.trim() === "") {
                            valueToSave = "";
                          } else {
                            const dialingCode = getDialingCode(countryCode);
                            // Remove leading 0 if present and combine without space
                            const phoneWithoutLeadingZero = editValue.replace(/^0+/, '');
                            valueToSave = `${dialingCode}${phoneWithoutLeadingZero}`;
                          }
                        }

                        await updateRegistrationField(
                          data.registration_id,
                          field.field_id || "",
                          field.label,
                          typeParam,
                          valueToSave,
                          userId,
                          metadata?.sensitive_information
                        );

                        toast.success(`${field.label} updated successfully`, {
                          duration: 3000,
                        });
                        setUpdatedFieldValues((prev) => ({
                          ...prev,
                          [field.label]: valueToSave,
                        }));
                        setEditingFieldId(null);
                      } catch (error) {
                        console.error("Error updating field:", error);
                        toast.error("Failed to update field", {
                          duration: 3000,
                        });
                      } finally {
                        setIsSaving(false);
                      }
                    };

                    const handleEdit = async () => {
                      // Load metadata first if not already loaded
                      if (!metadata && field.field_id) {
                        setLoadingFieldId(field.label);
                        try {
                          const response = await fetchRegistrationField(
                            clubAccountId,
                            field.field_id
                          );
                          setFieldMetadata((prev) => ({
                            ...prev,
                            [field.label]: response.field,
                          }));
                          // Set editing state after metadata is loaded
                          setEditingFieldId(field.label);
                          // Use the updated value if it exists, otherwise use the original
                          const valueToSet = updatedFieldValues[field.label] ?? field.value;
                          
                          // If it's a phone number, parse out the country code and number
                          if (response.field?.phone_number_input === true) {
                            // Try to match the phone number by checking against known dialing codes
                            let phoneNumber = valueToSet;
                            
                            // Sort by dialing code length (longest first) to match longest first
                            const sortedCodes = [...countryCodes].sort((a, b) => b.dialingCode.length - a.dialingCode.length);
                            
                            for (const country of sortedCodes) {
                              if (valueToSet.startsWith(country.dialingCode)) {
                                phoneNumber = valueToSet.substring(country.dialingCode.length);
                                setCountryCode(country.code);
                                break;
                              }
                            }
                            
                            setEditValue(phoneNumber);
                          } else {
                            setEditValue(valueToSet);
                          }
                        } catch (error) {
                          console.error("Error loading field metadata:", error);
                          // Still set editing state even if metadata fetch fails
                          setEditingFieldId(field.label);
                          setEditValue(updatedFieldValues[field.label] ?? field.value);
                        } finally {
                          setLoadingFieldId(null);
                        }
                      } else {
                        // Metadata already exists, set editing state immediately
                        setEditingFieldId(field.label);
                        // Use the updated value if it exists, otherwise use the original
                        const valueToSet = updatedFieldValues[field.label] ?? field.value;
                        
                        // If it's a phone number, parse out the country code and number
                        if (metadata?.phone_number_input === true) {
                          // Try to match the phone number by checking against known dialing codes
                          let phoneNumber = valueToSet;
                          
                          // Sort by dialing code length (longest first) to match longest first
                          const sortedCodes = [...countryCodes].sort((a, b) => b.dialingCode.length - a.dialingCode.length);
                          
                          for (const country of sortedCodes) {
                            if (valueToSet.startsWith(country.dialingCode)) {
                              phoneNumber = valueToSet.substring(country.dialingCode.length);
                              setCountryCode(country.code);
                              break;
                            }
                          }
                          
                          setEditValue(phoneNumber);
                        } else {
                          setEditValue(valueToSet);
                        }
                      }
                    };

                    const renderInput = () => {
                      const inputType = metadata?.input_type || "TEXT";
                      const options = metadata?.options || [];
                      const isPhoneNumber = metadata?.phone_number_input === true;

                      if (inputType === "DROPDOWN") {
                        const handleDropdownChange = (val: string) => {
                          // If "undefined" is selected and field is not required, clear the value
                          const valueToSet = val === "undefined" ? "" : val
                          setEditValue(valueToSet)
                        }

                        return (
                          <Select
                            value={editValue || "undefined"}
                            onValueChange={handleDropdownChange}
                          >
                            <SelectTrigger className="w-full text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {!metadata?.required && (
                                <SelectItem value="undefined" className="text-muted-foreground">
                                  -- Not Selected --
                                </SelectItem>
                              )}
                              {options.map((option: string) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      } else if (inputType === "CHECKBOX") {
                        return (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={editValue === "true"}
                              onCheckedChange={(checked) => {
                                setEditValue(checked ? "true" : "false");
                              }}
                            />
                          </div>
                        );
                      } else if (inputType === "NUMBER") {
                        return (
                          <Input
                            autoFocus
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSave();
                              } else if (e.key === "Escape") {
                                setEditingFieldId(null);
                                setEditValue("");
                              }
                            }}
                          />
                        );
                      } else if (isPhoneNumber) {
                        return (
                          <div className="flex gap-2">
                            <Select
                              value={countryCode}
                              onValueChange={setCountryCode}
                            >
                              <SelectTrigger className="w-[130px] text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {countryCodes.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.dialingCode} {country.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              autoFocus
                              type="tel"
                              value={editValue}
                              onChange={(e) => {
                                let value = e.target.value;
                                // Remove leading 0 if the user starts with it
                                if (value.startsWith("0") && value.length > 1) {
                                  value = value.substring(1);
                                }
                                const digitsOnly = value.replace(/\D/g, "");
                                // Allow max 15 digits for phone numbers
                                if (digitsOnly.length <= 15) {
                                  setEditValue(value);
                                }
                              }}
                              placeholder="Phone number"
                              className="text-sm flex-1"
                              maxLength={20}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSave();
                                } else if (e.key === "Escape") {
                                  setEditingFieldId(null);
                                  setEditValue("");
                                }
                              }}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSave();
                              } else if (e.key === "Escape") {
                                setEditingFieldId(null);
                                setEditValue("");
                              }
                            }}
                          />
                        );
                      }
                    };

                    return (
                      <div
                        key={field.label}
                        className="group rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
                          <div className="relative min-w-0 flex-1 space-y-2.5">
                          {field.visible === false && (
                            <Badge className="absolute right-0 top-0 border-orange-200 bg-orange-50 text-orange-700">
                              Removed from registration form
                            </Badge>
                          )}
                          <div className="flex flex-wrap items-center gap-2 pr-28 lg:pr-0">
                            <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {field.label}
                            </Label>
                          </div>
                          {isEditing ? (
                            renderInput()
                          ) : (
                            <>
                              {(field.input_type === "CHECKBOX" || metadata?.input_type === "CHECKBOX" || parseBooleanLikeValue(displayValue) !== null) ? (
                                (() => {
                                  const checked = parseBooleanLikeValue(displayValue) === true;

                                  return (
                                    <div
                                      className={cn(
                                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                                        checked
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                          : "border-rose-200 bg-rose-50 text-rose-700"
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "flex h-5 w-5 items-center justify-center rounded-full border text-xs",
                                          checked
                                            ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                                            : "border-rose-500 bg-rose-100 text-rose-700"
                                        )}
                                      >
                                        {checked ? "✓" : "✗"}
                                      </span>
                                      {checked ? "Yes" : "No"}
                                    </div>
                                  );
                                })()
                              ) : (
                                <p className="text-sm leading-6 text-slate-700">{displayValue || "-"}</p>
                              )}
                            </>
                          )}
                          </div>
                        {!data?.deregistered_on && field.field_id && !((field.input_type === "CHECKBOX" || metadata?.input_type === "CHECKBOX") && metadata?.required) && field.visible !== false && (
                          <div className="flex shrink-0 items-center gap-2 lg:ml-4">
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleSave}
                                  disabled={isSaving}
                                  className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                >
                                  <Check className="mr-1 h-4 w-4" />
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingFieldId(null);
                                    setEditValue("");
                                  }}
                                  disabled={isSaving}
                                  className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                >
                                  <X className="mr-1 h-4 w-4" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleEdit}
                                disabled={loadingFieldId === field.label}
                                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                              >
                                {loadingFieldId === field.label ? (
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : (
                                  <PencilIcon className="mr-1 h-4 w-4" />
                                )}
                                Update
                              </Button>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                    );
                  }

                  if (field.type === "BILLING") {
                    return (
                      <div
                        key={field.label}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50/40 px-4 py-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {field.label}{" "}
                              {field.quantity ? `(x${field.quantity})` : null}
                            </Label>
                            {field.visible === false && (
                              <Badge className="border-orange-200 bg-orange-50 text-orange-700">
                                Removed from registration form
                              </Badge>
                            )}
                          </div>
                          {field.discount && (
                            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
                              {field.discount}% off
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium leading-6 text-slate-800">
                          {field.value}
                        </p>
                      </div>
                    );
                  }

                  if (field.type === "TEXT") {
                    const cleaned = field.label
                      .replace(
                        /<ol>(\s*<li[^>]*data-list="bullet"[^>]*>[\s\S]*?)<\/ol>/g,
                        "<ul>$1</ul>"
                      )
                      .replace(/<span class="ql-ui"[^>]*><\/span>/g, "");

                    return (
                      <div
                        key={field.label}
                        className="prose prose-sm max-w-none border-none p-0 text-sm text-slate-700 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:list-inside [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside"
                        dangerouslySetInnerHTML={{ __html: cleaned }}
                      />
                    );
                  }
                  
                  if (field.type === "DNE") {
                    return (
                      <div
                        key={field.label}
                        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {field.label}
                          </Label>
                          {field.visible === false && (
                            <Badge className="border-orange-200 bg-orange-50 text-orange-700">
                              Removed from registration form
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm italic text-slate-500">
                          Not filled in by member.
                        </p>
                      </div>
                    );
                  }
                }
              )}
            </div>

            
                      {visiblePages.length > 1 && (
                        <div className="mt-5 flex flex-col gap-2.5 border-t border-slate-200 pt-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6">
                          {currentPageIndex > 0 ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => setCurrentPageIndex((i) => i - 1)}
                            >
                              <ChevronLeft className="mr-1 h-4 w-4" />
                              Previous
                            </Button>
                          ) : (
                            <div className="hidden sm:block" />
                          )}

                          <div className="text-center text-sm text-slate-500">
                            Page {currentPageIndex + 1} of {visiblePages.length}
                          </div>

                          {currentPageIndex < visiblePages.length - 1 ? (
                            <Button
                              type="button"
                              className="h-9 bg-black px-3 text-sm text-white hover:bg-slate-900"
                              onClick={() => setCurrentPageIndex((i) => i + 1)}
                            >
                              Next
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          ) : (
                            <div className="hidden sm:block" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
