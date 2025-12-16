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
import { Loader2, Edit, Trash2, Copy, PencilIcon } from "lucide-react";
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

function formatEpoch(epoch: number) {
  const date = new Date(epoch);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

export function CurrentMemberRegistration({
  userId,
  clubAccountId,
  currency,
  clubName,
}: {
  userId: string;
  clubAccountId: string;
  currency: string;
  clubName: string;
}) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState<
    Array<{ id: string; title: string; content: string; visibleToMember: boolean }>
  >([]);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
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
  const [fieldMetadata, setFieldMetadata] = useState<
    Record<string, FieldMetadata>
  >({});

  const { data, isLoading } = useFetchMemberRegisteration(
    clubAccountId,
    userId,
    currency
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

  // Preload metadata for all STANDARD_OTHER fields on initial load
  useEffect(() => {
    if (!data) return;

    const loadMetadata = async () => {
      const allFields = data.pages.flatMap(
        (page: {
          fields: Array<{ type: string; label: string; field_id?: string }>;
        }) =>
          page.fields.filter(
            (field: { type: string; field_id?: string }) =>
              field.type === "STANDARD_OTHER" && field.field_id
          )
      );

      for (const field of allFields) {
        if (!fieldMetadata[field.label]) {
          try {
            const fieldData = await fetchRegistrationField(
              clubAccountId,
              field.field_id
            );
            setFieldMetadata((prev) => ({
              ...prev,
              [field.label]: fieldData.field,
            }));
          } catch (error) {
            console.error(`Error loading metadata for ${field.label}:`, error);
          }
        }
      }
    };

    loadMetadata();
  }, [data, clubAccountId, fieldMetadata]);

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

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center p-5 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 flex-1 min-h-0 flex flex-col">
      {/* Transaction ID */}
      {data?.transaction_id && (
        <div className="flex items-center gap-2 text-sm bg-transparent p-2">
          <span className="text-muted-foreground text-xs">Transaction ID:</span>
          <strong className="text-xs font-mono">{data.transaction_id}</strong>
          <button
            onClick={() => {
              navigator.clipboard.writeText(data.transaction_id);
            }}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Copy transaction ID"
          >
            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap justify-center items-center gap-4 text-sm bg-muted/30 p-2 rounded-lg border">
        {data?.registration_submitted_on && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs">Submitted:</span>
            <strong className="text-xs">
              {formatEpoch(data.registration_submitted_on)}
            </strong>
          </div>
        )}

        {data?.registration_submitted_on && data?.registered_on && (
          <span className="text-gray-300">|</span>
        )}

        {data?.registered_on && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs">Registered:</span>
            <strong className="text-green-600 text-xs">
              {formatEpoch(data.registered_on)}
            </strong>
          </div>
        )}

        {(data?.registered_on && data?.deregistered_on) ||
        (data?.registration_submitted_on && data?.deregistered_on) ? (
          <span className="text-gray-300">|</span>
        ) : null}

        {data?.deregistered_on && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs">Deregistered:</span>
            <strong className="text-red-600 text-xs">
              {formatEpoch(data.deregistered_on)}
            </strong>
          </div>
        )}
      </div>

      <Card className="w-full border shadow-sm pt-0 flex-1 min-h-0 flex flex-col gap-1">
        <CardHeader className="border-b bg-muted/30 py-1 pb-1 flex flex-row items-center justify-center relative">
          <div className="text-center">
            <CardTitle className="text-l pt-2">{clubName}</CardTitle>
            <CardDescription className="text-xs pt-2">
              Member Registration Form
            </CardDescription>
          </div>
          <div className="absolute right-4">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Admin Notes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Admin Notes</DialogTitle>
                  <DialogDescription>
                    Add additional information or notes to this member's
                    registration
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="note-title">Note Title</Label>
                    <Input
                      id="note-title"
                      placeholder="e.g., Special Request, Health Information"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note-content">Note Content</Label>
                    <Textarea
                      id="note-content"
                      placeholder="Enter your additional information here..."
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
                    <Label htmlFor="visible-to-member" className="font-normal cursor-pointer">
                      Visible to Member
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
                    {updateNotesMutation.isPending ? "Saving..." : "Add Note"}
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
          </div>
        </CardHeader>
        <CardContent className="py-2 px-4 flex-1 min-h-0 flex flex-col">
          {adminNotes.length > 0 && (
            <div className="mb-3 border rounded-lg">
              <button
                onClick={() => setIsNotesOpen(!isNotesOpen)}
                className="w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors"
              >
                <span className="font-semibold text-sm text-blue-900">
                  Admin Notes ({adminNotes.length})
                </span>
                <span className="text-lg">{isNotesOpen ? "▼" : "▶"}</span>
              </button>
              {isNotesOpen && (
                <div className="bg-blue-50 border-t border-blue-200 p-3 space-y-3">
                  {adminNotes.map((note) => (
                    <div
                      key={note.id}
                      className="pb-3 border-b last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            {note.title}
                          </p>
                          {note.visibleToMember && (
                            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded mb-2">
                              Visible to Member
                            </span>
                          )}
                          <p className="text-xs text-blue-800 whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  removeNotesMutation.mutate([note.id])
                                }
                                disabled={removeNotesMutation.isPending}
                                className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              Delete this note
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div
            key={data.pages[currentPageIndex].page_index}
            className="flex-1 min-h-0 flex flex-col"
          >
            <h3 className="text-base font-semibold text-center border-b pb-2">
              {data.pages[currentPageIndex].page_header}
            </h3>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-1 px-2 py-2">
              {data.pages[currentPageIndex].fields.map(
                (field: {
                  type: string;
                  label: string;
                  value: string;
                  field_id?: string;
                  signature_type?: string;
                  quantity?: number;
                  discount?: number;
                }) => {

                  if (field.type === "STANDARD_SIGNATURE") {
                    if (field.signature_type === "signature") {
                      return (
                        <div
                          key={field.label}
                          className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg"
                        >
                          <Label className="text-xs font-semibold text-muted-foreground">
                            {field.label}
                          </Label>
                          <img
                            src={field.value}
                            alt="User Signature"
                            className="border-b-2 border-gray-400 max-w-xs"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={field.label}
                          className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg"
                        >
                          <Label className="text-xs font-semibold text-muted-foreground">
                            {field.label}
                          </Label>
                          <Label className="text-xs font-[cursive] border-b-2 border-gray-400 pb-1">
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
                          userId
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
                        return (
                          <Select
                            value={editValue}
                            onValueChange={setEditValue}
                          >
                            <SelectTrigger className="w-full text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                        className="flex items-center justify-between group"
                      >
                        <div className="flex-1 flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            {field.label}
                          </Label>
                          {isEditing ? (
                            renderInput()
                          ) : (
                            <>
                              {metadata?.input_type === "CHECKBOX" ? (
                                <div className="flex items-center gap-2">
                                  {displayValue === "true" ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded border-2 border-green-600 bg-green-100 flex items-center justify-center">
                                        <span className="text-green-700 font-bold text-xs">
                                          ✓
                                        </span>
                                      </div>
                                      <span className="text-sm text-green-700 font-medium">
                                        Yes
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded border-2 border-red-600 bg-red-100 flex items-center justify-center">
                                        <span className="text-red-700 font-bold text-xs">
                                          ✗
                                        </span>
                                      </div>
                                      <span className="text-sm text-red-500 font-medium">
                                        No
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Label className="text-xs border-b-2 border-gray-300 pb-1">
                                  {displayValue}
                                </Label>
                              )}
                            </>
                          )}
                        </div>
                        {!data?.deregistered_on && field.field_id && !(metadata?.input_type === "CHECKBOX" && metadata?.required) && (
                          <div className="flex gap-1 ml-2 opacity-30 group-hover:opacity-100 transition-opacity">
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSave}
                                  disabled={isSaving}
                                  className="h-8 w-8 p-0"
                                  title="Save"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingFieldId(null);
                                    setEditValue("");
                                  }}
                                  disabled={isSaving}
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
                                title="Update this field"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (field.type === "BILLING") {
                    return (
                      <div
                        key={field.label}
                        className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg border"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            {field.label}{" "}
                            {field.quantity ? `(x${field.quantity})` : null}
                          </Label>
                          {field.discount && (
                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                              {field.discount}% off
                            </span>
                          )}
                        </div>
                        <Label className="text-sm font-medium border-b-2 border-gray-300 pb-1">
                          {field.value}
                        </Label>
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
                        className="prose prose-sm max-w-none text-gray-700 p-3 bg-muted/10 rounded-lg text-xs [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5"
                        dangerouslySetInnerHTML={{ __html: cleaned }}
                      />
                    );
                  }
                  
                  if (field.type === "DNE") {
                    return (
                      <div
                        key={field.label}
                        className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-lg border border-dashed"
                      >
                        <Label className="text-xs font-semibold text-muted-foreground">
                          {field.label}
                        </Label>
                        <Label className="text-xs italic text-gray-500">
                          Not filled in by member.
                        </Label>
                      </div>
                    );
                  }
                }
              )}
            </div>

            
            {data.pages.length > 1 && (
              <div className="flex justify-between items-center pt-3 border-t mt-2">
                {currentPageIndex > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-[90px]"
                    onClick={() => setCurrentPageIndex((i) => i - 1)}
                  >
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                <div className="text-xs text-muted-foreground">
                  Page {currentPageIndex + 1} of {data.pages.length}
                </div>

                {currentPageIndex < data.pages.length - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-[90px]"
                    onClick={() => setCurrentPageIndex((i) => i + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
