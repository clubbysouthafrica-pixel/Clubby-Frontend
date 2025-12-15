import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { fetchRegistrationField, updateRegistrationField } from "@/services/admin/registration-form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface FieldData {
  visible: boolean;
  field_order_id: number;
  field_name: string;
  required: boolean;
  field_id: string;
  field_type: string;
  placeholder?: string;
  page_index: number;
  club_account_id: string;
  options?: string[];
  input_type: string;
  page_header: string;
}

interface EditRegistrationFieldDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fieldLabel: string | null;
  fieldValue: string;
  fieldDbId: string | null;
  clubAccountId: string;
  registrationId: string;
  userId: string;
  onSave: (fieldId: string | null, newValue: string) => void;
}

export function EditRegistrationFieldDialog({
  isOpen,
  onOpenChange,
  fieldLabel,
  fieldValue,
  fieldDbId,
  clubAccountId,
  registrationId,
  userId,
  onSave,
}: EditRegistrationFieldDialogProps) {
  const [editValue, setEditValue] = useState<string>(fieldValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldData, setFieldData] = useState<FieldData | null>(null);

  useEffect(() => {
    setEditValue(fieldValue);
  }, [fieldValue]);

  const loadFieldData = useCallback(async () => {
    if (!fieldDbId) return;

    setIsLoading(true);
    try {
      const data = await fetchRegistrationField(clubAccountId, fieldDbId);
      setFieldData(data.field);
      // Auto-populate with current value if exists
      if (fieldValue) {
        setEditValue(fieldValue);
      }
    } catch (error) {
      console.error("Error fetching field info:", error);
      toast.error("Error loading field information", {
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [fieldDbId, clubAccountId, fieldValue]);

  useEffect(() => {
    if (isOpen && fieldDbId) {
      loadFieldData();
    }
  }, [isOpen, fieldDbId, loadFieldData]);

  const handleSave = async () => {
    // Validate required fields
    if (fieldData?.required) {
      const inputType = fieldData.input_type?.toUpperCase();
      
      // Check for undefined
      if (editValue === undefined) {
        toast.error(`${fieldData.field_name} is required`, {
          duration: 3000,
        });
        return;
      }
      
      // Check for empty string (TEXT fields)
      if (inputType === "TEXT" || inputType === "DROPDOWN") {
        if (editValue.trim() === "") {
          toast.error(`${fieldData.field_name} cannot be empty`, {
            duration: 3000,
          });
          return;
        }
      }
      
      // Check for 0 (NUMBER fields)
      if (inputType === "NUMBER") {
        if (editValue === undefined || editValue === "") {
          toast.error(`${fieldData.field_name} is required`, {
            duration: 3000,
          });
          return;
        }
      }
      
      // Check for unchecked (CHECKBOX fields)
      if (inputType === "CHECKBOX") {
        if (editValue !== "true") {
          toast.error(`${fieldData.field_name} must be checked`, {
            duration: 3000,
          });
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      let type = ""
      if (fieldData?.input_type === "DROPDOWN") {
        type = "STANDARD_DROPDOWN"
      } else if (fieldData?.input_type === "CHECKBOX") {
        type = "STANDARD_CHECKBOX"
      } else if (fieldData?.input_type === "NUMBER") {
        type = "STANDARD_NUMBER"
      } else {
        type = "STANDARD_TEXT"
      }

      await updateRegistrationField(
        registrationId,
        userId,
        fieldDbId!,
        fieldData?.field_name || fieldLabel || "",
        type,
        editValue
      );
      
      toast.success(`${fieldData?.field_name || fieldLabel} updated successfully`, {
        duration: 3000,
      });
      onSave(fieldDbId, editValue);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error("Failed to update field", {
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditValue(fieldValue);
      setFieldData(null);
      // Move focus away from dialog when closing
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    onOpenChange(open);
  };

  const renderFieldInput = () => {
    if (!fieldData) return null;



    const { input_type, options, placeholder } = fieldData;

    switch (input_type?.toUpperCase()) {
      case "DROPDOWN":
        return (
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "CHECKBOX":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={editValue === "true"}
              onCheckedChange={(checked) =>
                setEditValue(checked ? "true" : "")
              }
            />
            <Label>{fieldData.field_name}</Label>
          </div>
        );
      case "TEXT":
      case "NUMBER":
      default:
        return (
          <Input
            id="edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder || "Enter new value"}
            className="w-full"
            type={input_type?.toLowerCase() === "number" ? "number" : "text"}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update {fieldLabel}</DialogTitle>
          <DialogDescription>
            {fieldData?.placeholder ?? "Edit the value for this field"}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="py-4">
              <Label
                htmlFor="edit-input"
                className="text-sm font-medium mb-2 block"
              >
                {fieldData?.field_name || fieldLabel}
                {fieldData?.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              {renderFieldInput()}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isSaving}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
