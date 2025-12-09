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
import { fetchRegistrationField } from "@/services/admin/registration-form";
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
  onSave: (fieldId: string | null, newValue: string) => void;
}

export function EditRegistrationFieldDialog({
  isOpen,
  onOpenChange,
  fieldLabel,
  fieldValue,
  fieldDbId,
  clubAccountId,
  onSave,
}: EditRegistrationFieldDialogProps) {
  const [editValue, setEditValue] = useState<string>(fieldValue);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldData, setFieldData] = useState<FieldData | null>(null);

  useEffect(() => {
    setEditValue(fieldValue);
  }, [fieldValue]);

  const loadFieldData = useCallback(async () => {
    if (!fieldDbId) return;

    setIsLoading(true);
    try {
      const data = await fetchRegistrationField(clubAccountId, fieldDbId);
      setFieldData(data);
      // Auto-populate with current value if exists
      if (fieldValue) {
        setEditValue(fieldValue);
      }
    } catch (error) {
      console.error("Error fetching field info:", error);
      toast.error("Error loading field information");
    } finally {
      setIsLoading(false);
    }
  }, [fieldDbId, clubAccountId, fieldValue]);

  useEffect(() => {
    if (isOpen && fieldDbId) {
      loadFieldData();
    }
  }, [isOpen, fieldDbId, loadFieldData]);

  const handleSave = () => {
    // TODO: Call API to update the field using fieldDbId
    console.log("Saving field:", {
      fieldDbId,
      oldValue: fieldValue,
      newValue: editValue,
    });
    onSave(fieldDbId, editValue);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditValue(fieldValue);
      setFieldData(null);
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
            Edit the value for this field
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
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
