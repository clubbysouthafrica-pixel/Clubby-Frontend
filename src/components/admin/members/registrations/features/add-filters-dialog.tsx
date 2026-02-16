import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface AddFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableFields: { key: string; field_name: string; type: string; options: string[] }[];
  activeFilterKeys: string[];
  onFilterKeysChange: (keys: string[]) => void;
  buttonText?: string;
  title?: string;
  description?: string;
}

export default function AddFiltersDialog({
  open,
  onOpenChange,
  availableFields,
  activeFilterKeys,
  onFilterKeysChange,
  buttonText = "+ Add Filter",
  title = "Add Filters",
  description = "Select which filters you want to display",
}: AddFiltersDialogProps) {
  const [tempFilterKeys, setTempFilterKeys] = useState<string[]>(activeFilterKeys);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTempFilterKeys(activeFilterKeys);
    }
    onOpenChange(newOpen);
  };

  const handleApply = () => {
    onFilterKeysChange(tempFilterKeys);
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
                  id={`filter-${key}`}
                  checked={tempFilterKeys.includes(key)}
                  onCheckedChange={(checked) => {
                    setTempFilterKeys(
                      checked
                        ? [...tempFilterKeys, key]
                        : tempFilterKeys.filter((k) => k !== key)
                    );
                  }}
                />
                <label
                  htmlFor={`filter-${key}`}
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
