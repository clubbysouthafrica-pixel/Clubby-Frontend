import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface AddColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableFields: { key: string; field_name: string; type: string; options: string[] }[];
  activeColumnKeys: string[];
  onColumnKeysChange: (keys: string[]) => void;
  buttonText?: string;
  title?: string;
  description?: string;
}

export default function AddColumnsDialog({
  open,
  onOpenChange,
  availableFields,
  activeColumnKeys,
  onColumnKeysChange,
  buttonText = "+ Add Column",
  title = "Add Columns",
  description = "Select which columns you want to display",
}: AddColumnsDialogProps) {
  const [tempColumnKeys, setTempColumnKeys] = useState<string[]>(activeColumnKeys);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTempColumnKeys(activeColumnKeys);
    }
    onOpenChange(newOpen);
  };

  const handleApply = () => {
    onColumnKeysChange(tempColumnKeys);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {availableFields &&
            availableFields.map(({ key, field_name }) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={`col-${key}`}
                  checked={tempColumnKeys.includes(key)}
                  onCheckedChange={(checked) => {
                    setTempColumnKeys(
                      checked
                        ? [...tempColumnKeys, key]
                        : tempColumnKeys.filter((k) => k !== key)
                    );
                  }}
                />
                <label
                  htmlFor={`col-${key}`}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {field_name}
                </label>
              </div>
            ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
