import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useFetchMemberRegisteration } from "@/queries/registration-form";
import { Loader2, AlertCircle, PencilIcon, Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  fetchMemberRegistrationField,
  updateMemberRegistrationField,
} from "@/services/registration-form";
import {
  validateFieldValue,
  getStandardFieldType,
} from "@/utils/fieldValidation";
import { countryCodes, getDialingCode } from "@/data/country-codes";

export function MemberRegistration({
  clubAccountId,
  clubName,
  currency,
  membershipStatus,
}: {
  clubAccountId: string;
  currency: string;
  clubName: string;
  membershipStatus: string;
}) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isAdminNotesOpen, setIsAdminNotesOpen] = useState(true);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("ZA");
  const [updatedFieldValues, setUpdatedFieldValues] = useState<
    Record<string, string>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [fieldMetadata, setFieldMetadata] = useState<
    Record<
      string,
      {
        input_type: string;
        options?: string[];
        required?: boolean;
        placeholder?: string;
        editable_by_member?: boolean;
        phone_number_input?: boolean;
        sensitive_information?: boolean;
      }
    >
  >({});

  const { data, isLoading } = useFetchMemberRegisteration(
    clubAccountId,
    currency
  );

  const getDeregReason = (d: unknown): string | undefined => {
    if (typeof d === "object" && d !== null && "deregistration_reason" in d) {
      const val = (d as { deregistration_reason?: unknown })
        .deregistration_reason;
      if (typeof val === "string" && val.trim()) return val;
    }
    return undefined;
  };
  const deregReason = getDeregReason(data);

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
            const fieldData = await fetchMemberRegistrationField(
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

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center p-5 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 flex-1 min-h-0 flex flex-col mt-6">
      {/* Deregistration reason (when provided by the club) */}
      {deregReason && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertCircle className="h-4 w-4" />
            <h3 className="text-xs font-semibold">Why was I deregistered?</h3>
          </div>
          <div className="text-xs text-gray-700 whitespace-pre-wrap">
            {deregReason}
          </div>
        </div>
      )}

      {/* Registration Form Card */}
      <Card
        className="w-full border shadow-sm pt-0 flex-1 min-h-0 flex flex-col gap-1"
        id="registration-card-header"
      >
        <CardHeader className="border-b bg-muted/30 py-1 pb-1">
          <CardTitle className="text-l text-center pt-2">{clubName}</CardTitle>
          <CardDescription className="text-center text-xs">
            {membershipStatus === "Resubmission required"
              ? "Deregistered Registration Form"
              : "Submitted Registration Form"}
          </CardDescription>
        </CardHeader>
        {data.admin_notes && data.admin_notes.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
            <button
              onClick={() => setIsAdminNotesOpen(!isAdminNotesOpen)}
              className="w-full flex items-center justify-between hover:bg-amber-100 transition-colors -mx-4 -my-3 px-4 py-3 rounded cursor-pointer"
            >
              <h4 className="text-sm font-semibold text-amber-900">
                📝 Notes from Club Staff ({data.admin_notes.filter((note: { visibleToMember: boolean }) => note.visibleToMember).length})
              </h4>
              <span className="text-lg text-amber-900">
                {isAdminNotesOpen ? "▼" : "▶"}
              </span>
            </button>
            {isAdminNotesOpen && (
              <div className="space-y-3 mt-3">
                {data.admin_notes
                  .filter((note: { visibleToMember: boolean }) => note.visibleToMember)
                  .map((note: { id: string; title: string; content: string }) => (
                    <div key={note.id} className="pb-3 border-b border-amber-100 last:border-b-0 last:pb-0">
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        {note.title}
                      </p>
                      <p className="text-xs text-amber-800 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
        <CardContent className="py-2 px-4 flex-1 min-h-0 flex flex-col">
          <div
            key={data.pages[currentPageIndex].page_index}
            className="flex-1 min-h-0 flex flex-col"
          >
            <h3 className="text-base font-semibold text-center border-b pb-2">
              {data.pages[currentPageIndex].page_header}
            </h3>

            <div className="flex-none space-y-6 px-2 py-2">
              {data.pages[currentPageIndex].fields.map(
                (field: {
                  type: string;
                  label: string;
                  value: string;
                  field_id?: string;
                  signature_type?: string;
                  quantity?: number;
                  discount?: number;
                  editable_by_member?: boolean;
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
                          <Label className="text-sm font-[cursive] border-b-2 border-gray-400 pb-1">
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

                        await updateMemberRegistrationField(
                          data.registration_id,
                          field.field_id || "",
                          field.label,
                          typeParam,
                          valueToSave,
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
                      if (!metadata && field.field_id) {
                        try {
                          const data = await fetchMemberRegistrationField(
                            clubAccountId,
                            field.field_id
                          );
                          setFieldMetadata((prev) => ({
                            ...prev,
                            [field.label]: data.field,
                          }));
                          setEditingFieldId(field.label);
                          const valueToSet = updatedFieldValues[field.label] ?? field.value;
                          
                          // If it's a phone number, parse out the country code and number
                          if (data.field?.phone_number_input === true) {
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
                        }
                      } else {
                        setEditingFieldId(field.label);
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
                            {metadata?.placeholder}
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
                                <Label className="text-sm border-b-2 border-gray-300 pb-1">
                                  {displayValue}
                                </Label>
                              )}
                            </>
                          )}
                        </div>
                        {membershipStatus !== "Resubmission required" &&
                          field.field_id && metadata?.editable_by_member && (
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
                        className="prose prose-sm max-w-none text-gray-700 p-3 bg-muted/10 rounded-lg text-sm [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5"
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
              <div className="flex justify-between items-center pt-3 border-t">
                {currentPageIndex > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-[90px]"
                    onClick={() => {
                      setCurrentPageIndex((i) => i - 1);
                      document
                        .getElementById("registration-card-header")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
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
                    onClick={() => {
                      setCurrentPageIndex((i) => i + 1);
                      document
                        .getElementById("registration-card-header")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
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
