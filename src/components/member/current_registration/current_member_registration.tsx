import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
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
import { fetchMemberRegistrationField, updateMemberRegistrationField } from "@/services/registration-form";
import { validateFieldValue, getStandardFieldType } from "@/utils/fieldValidation";

export function MemberRegistration({
  clubAccountId,
  clubName,
  currency,
  membershipStatus
}: { clubAccountId: string, currency: string, clubName: string, membershipStatus: string }) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [updatedFieldValues, setUpdatedFieldValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [fieldMetadata, setFieldMetadata] = useState<Record<string, { input_type: string; options?: string[]; required?: boolean, placeholder?: string }>>({});

  const { data, isLoading } = useFetchMemberRegisteration(
    clubAccountId,
    currency
  );

  const getDeregReason = (d: unknown): string | undefined => {
    if (typeof d === "object" && d !== null && "deregistration_reason" in d) {
      const val = (d as { deregistration_reason?: unknown }).deregistration_reason;
      if (typeof val === "string" && val.trim()) return val;
    }
    return undefined;
  };
  const deregReason = getDeregReason(data);

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
      <Card className="w-full border shadow-sm pt-0 flex-1 min-h-0 flex flex-col gap-1" id="registration-card-header">
        <CardHeader className="border-b bg-muted/30 py-1 pb-1">
          <CardTitle className="text-l text-center pt-2">
            {clubName}
          </CardTitle>
          <CardDescription className="text-center text-xs">
            {membershipStatus === "Resubmission required" ? "Deregistered Registration Form" : "Submitted Registration Form" }
          </CardDescription>
        </CardHeader>
        <CardContent className="py-2 px-4 flex-1 min-h-0 flex flex-col">
          <div key={data.pages[currentPageIndex].page_index} className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-base font-semibold text-center border-b pb-2">
              {data.pages[currentPageIndex].page_header}
            </h3>
            
            <div className="flex-none space-y-6 px-2 py-2">
              {data.pages[currentPageIndex].fields.map((field: { type: string; label: string; value: string; field_id?: string; signature_type?: string; quantity?: number; discount?: number }) => {

                if (field.type === "STANDARD_SIGNATURE") {
                  if (field.signature_type === "signature") {
                    return (
                      <div key={field.label} className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
                        <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
                        <img
                          src={field.value}
                          alt="User Signature"
                          className="border-b-2 border-gray-400 max-w-xs"
                        />
                      </div>
                    )
                  } else {
                    return (
                      <div key={field.label} className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
                        <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
                        <Label className="text-sm font-[cursive] border-b-2 border-gray-400 pb-1">
                          {field.value}
                        </Label>
                      </div>
                    )
                  }
                }

                if (field.type === "STANDARD_OTHER") {
                  const isEditing = editingFieldId === field.label;
                  const displayValue = isEditing ? editValue : (updatedFieldValues[field.label] ?? field.value);
                  const metadata = fieldMetadata[field.label];
                  
                  const handleSave = async () => {
                    setIsSaving(true);
                    try {
                      const fieldType = metadata?.input_type || "TEXT";
                      
                      // Validate required fields
                      const validationError = validateFieldValue(field.label, editValue, metadata);
                      if (validationError) {
                        toast.error(validationError, {
                          duration: 3000,
                        });
                        setIsSaving(false);
                        return;
                      }
                      
                      const typeParam = getStandardFieldType(fieldType);

                      await updateMemberRegistrationField(
                        data.registration_id,
                        field.field_id || "",
                        field.label,
                        typeParam,
                        editValue
                      );
                      
                      toast.success(`${field.label} updated successfully`, {
                        duration: 3000,
                      });
                      setUpdatedFieldValues((prev) => ({
                        ...prev,
                        [field.label]: editValue,
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
                        const data = await fetchMemberRegistrationField(clubAccountId, field.field_id);
                        setFieldMetadata((prev) => ({
                          ...prev,
                          [field.label]: data.field,
                        }));
                        // Set editing state after metadata is loaded
                        setEditingFieldId(field.label);
                        setEditValue(field.value);
                      } catch (error) {
                        console.error("Error loading field metadata:", error);
                      }
                    } else {
                      // Metadata already exists, set editing state immediately
                      setEditingFieldId(field.label);
                      setEditValue(field.value);
                    }
                  };

                  const renderInput = () => {
                    const inputType = metadata?.input_type || "TEXT";
                    const options = metadata?.options || [];

                    if (inputType === "DROPDOWN") {
                      return (
                        <Select value={editValue} onValueChange={setEditValue}>
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
                            onCheckedChange={(checked) =>
                              setEditValue(checked ? "true" : "")
                            }
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
                    <div key={field.label} className="flex items-center justify-between group">
                      <div className="flex-1 flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
                        <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
                        {isEditing ? (
                          renderInput()
                        ) : (
                          <Label className="text-sm border-b-2 border-gray-300 pb-1">
                            {displayValue}
                          </Label>
                        )}
                      </div>
                      {membershipStatus !== "Resubmission required" && field.field_id && (
                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <div key={field.label} className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          {field.label} {field.quantity ? `(x${field.quantity})` : null}
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
                    <div key={field.label} className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-lg border border-dashed">
                      <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
                      <Label className="text-xs italic text-gray-500">
                        Not filled in by member.
                      </Label>
                    </div>
                  );
                }

              })}
            </div>

            {/* Pagination Controls */}
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
                      document.getElementById('registration-card-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                      document.getElementById('registration-card-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
