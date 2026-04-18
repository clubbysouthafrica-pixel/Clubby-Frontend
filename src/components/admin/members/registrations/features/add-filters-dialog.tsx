import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface AddFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableFields: { key: string; field_name: string; type: string; options?: string[] }[];
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
  const [showRegistrationFields, setShowRegistrationFields] = useState(false);
  const [showClubTags, setShowClubTags] = useState(false);

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

  const registrationFields = availableFields?.filter(
    (field) => field.type !== "club_variable",
  );
  const clubTagFields = availableFields?.filter(
    (field) => field.type === "club_variable",
  );

  const registrationSelectedCount = registrationFields.filter((field) =>
    tempFilterKeys.includes(field.key),
  ).length;
  const clubTagSelectedCount = clubTagFields.filter((field) =>
    tempFilterKeys.includes(field.key),
  ).length;

  useEffect(() => {
    if (registrationSelectedCount > 0) {
      setShowRegistrationFields(true);
    }
  }, [registrationSelectedCount]);

  useEffect(() => {
    if (clubTagSelectedCount > 0) {
      setShowClubTags(true);
    }
  }, [clubTagSelectedCount]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-8 rounded-full border-slate-200 bg-white px-3.5 text-xs text-zinc-700 hover:bg-slate-100"
        >
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
          {registrationFields && registrationFields.length > 0 && (
            <Collapsible open={showRegistrationFields} onOpenChange={setShowRegistrationFields}>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 shadow-sm">
                <CollapsibleTrigger
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-100/80"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Registration Fields
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Filters based on registration field data.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                      {registrationSelectedCount}/{registrationFields.length} selected
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                      {showRegistrationFields ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 border-t border-slate-200 bg-white px-4 py-3">
                  {registrationFields.map(({ key, field_name }) => (
                    <label
                      key={key}
                      htmlFor={`filter-${key}`}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-slate-200 hover:bg-slate-50"
                    >
                      <Checkbox
                        id={`filter-${key}`}
                        checked={tempFilterKeys.includes(key)}
                        onCheckedChange={(checked) => {
                          setTempFilterKeys(
                            checked
                              ? [...tempFilterKeys, key]
                              : tempFilterKeys.filter((k) => k !== key),
                          );
                        }}
                      />
                      <span className="flex-1 text-sm font-medium text-slate-800">
                        {field_name}
                      </span>
                    </label>
                  ))}
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {clubTagFields && clubTagFields.length > 0 && (
            <Collapsible open={showClubTags} onOpenChange={setShowClubTags}>
              <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/70 shadow-sm">
                <CollapsibleTrigger
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-100/70"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Club Tags
                    </p>
                    <p className="mt-1 text-sm text-amber-900/80">
                      Filters based on club variable values saved for members.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-sm ring-1 ring-amber-200">
                      {clubTagSelectedCount}/{clubTagFields.length} selected
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm ring-1 ring-amber-200">
                      {showClubTags ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 border-t border-amber-200 bg-white px-4 py-3">
                  {clubTagFields.map(({ key, field_name }) => (
                    <label
                      key={key}
                      htmlFor={`filter-${key}`}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-amber-200 hover:bg-amber-50"
                    >
                      <Checkbox
                        id={`filter-${key}`}
                        checked={tempFilterKeys.includes(key)}
                        onCheckedChange={(checked) => {
                          setTempFilterKeys(
                            checked
                              ? [...tempFilterKeys, key]
                              : tempFilterKeys.filter((k) => k !== key),
                          );
                        }}
                      />
                      <span className="flex-1 text-sm font-medium text-slate-800">
                        {field_name}
                      </span>
                    </label>
                  ))}
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-full border-slate-200 bg-white px-3.5 text-xs text-zinc-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="h-8 rounded-full bg-zinc-700 px-3.5 text-xs text-white hover:bg-zinc-800"
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
