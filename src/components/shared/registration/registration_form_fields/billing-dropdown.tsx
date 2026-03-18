import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAmount } from "@/data/currencies";
import { useState, useEffect } from "react";

interface BillingOption {
  label: string;
  amount: number;
  option_order_id: string;
  multiplier?: boolean;
}

interface Field {
  field_id: string;
  field_name: string;
  field_type: string;
  placeholder?: string;
  required?: boolean;
  value?: string | number;
  billingOptions?: BillingOption[];
  multiplier_value?: number;
}

interface BillingSelectFieldProps {
  field: Field;
  clubCurrency: string | undefined;
  currentPageIndex: number;
  pages: any[];
  setFieldValue: (
    pageIndex: number,
    fieldId: string,
    updater: (f: any) => any,
  ) => void;
}

export default function BillingDropdown({
  field,
  clubCurrency,
  currentPageIndex,
  pages,
  setFieldValue,
}: BillingSelectFieldProps) {
  const [multiplier, setMultiplier] = useState(
    field?.multiplier_value ? field?.multiplier_value : 1,
  );
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = field.billingOptions?.find(
    (o) => o.label === field.value,
  );

  useEffect(() => {
    if (field?.multiplier_value) {
      setMultiplier(field?.multiplier_value);
    }
  }, [field?.multiplier_value, field?.value]);

  const onBillingSelect = (label: string) => {
    const valueToSet = label === "undefined" ? "" : label;
    const option = field.billingOptions?.find((o) => o.label === valueToSet);
    setMultiplier(1);
    setFieldValue(pages[currentPageIndex].page_index, field.field_id, (f) => ({
      ...f,
      value: valueToSet,
      selectedAmountCents: option?.amount,
      label: option?.label,
      option_order_id: option?.option_order_id,
      multiplier_value: undefined,
    }));
  };

  const onMultiplierChange = (multiplier_value: number) => {
    if (multiplier_value === 0 || !selectedOption) {
      setFieldValue(
        pages[currentPageIndex].page_index,
        field.field_id,
        (f) => ({
          ...f,
          multiplier_value: undefined,
        }),
      );
    } else {
      setFieldValue(
        pages[currentPageIndex].page_index,
        field.field_id,
        (f) => ({
          ...f,
          selectedAmountCents: (selectedOption?.amount ?? 0) * multiplier_value,
          multiplier_value,
        }),
      );
    }
  };

  return (
    <div className="space-y-2 relative min-w-0 w-full" key={field.field_id}>
      <Label className="block text-base font-medium text-gray-900">
        {field.field_name}
      </Label>

      <div className="space-y-0 relative min-w-0 w-full">
        <Select
          onValueChange={onBillingSelect}
          value={typeof field.value === "string" && field.value ? field.value : "undefined"}
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <SelectTrigger
            className={`w-full border border-gray-300 rounded-md px-3 py-2.5 text-base font-normal focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
              selectedOption?.multiplier && field.value
                ? "rounded-b-none border-b-0"
                : ""
            }`}
          >
            <SelectValue
              placeholder={field.placeholder ?? "Select membership type"}
            />
          </SelectTrigger>

          <SelectContent
            className={`${(field.billingOptions?.length ?? 0) > 5 ? "max-h-[400px] overflow-y-auto" : ""} w-full max-w-full overflow-x-auto left-0 right-0`}
            style={{ minWidth: 0, maxWidth: "90vw" }}
          >
            <SelectGroup>
              <SelectItem value="undefined" className="text-gray-500">
                -- Not Selected --
              </SelectItem>
              <SelectLabel className="text-gray-500/70">
                {field.field_name}
              </SelectLabel>
              {field.billingOptions?.map((opt) => (
                <SelectItem key={opt.option_order_id} value={opt.label}>
                  <div className="flex flex-col gap-1 py-2 w-full">
                    <div className="flex items-center gap-2">
                      <span>
                        {opt.label}{" "}
                        <strong>
                          (
                          {opt.amount == 0
                            ? "FREE"
                            : formatAmount(opt.amount, clubCurrency)}
                          )
                        </strong>
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {selectedOption?.multiplier && field.value && (
          <div
            className="flex w-full flex-wrap items-center gap-2 px-3 py-2 border border-gray-300 border-t-0 rounded-b-md bg-white"
            onClick={(e) => {
              if (!(e.target instanceof HTMLInputElement)) {
                setIsOpen(true);
              }
            }}
          >
            <p className="text-sm font-medium text-gray-900">{selectedOption.label}</p>
            <span className="text-gray-900 font-medium">×</span>
            <input
              type="number"
              value={multiplier}
              min="1"
              onChange={(e) => {
                const rawValue = parseInt(e.target.value);
                const val = isNaN(rawValue) ? 1 : Math.max(1, rawValue);
                setMultiplier(val);
                onMultiplierChange(val);
              }}
              onInvalid={(e) => (e as any).preventDefault()}
              className="w-16 h-7 px-2 text-center text-sm border border-gray-300 rounded-sm flex-shrink-0"
              style={{
                MozAppearance: "textfield",
                WebkitAppearance: "none",
                margin: 0,
              }}
            />
            <span className="text-gray-600 font-medium">=</span>
            <span className="font-semibold text-sm text-gray-900">
              {formatAmount(
                (selectedOption?.amount ?? 0) * multiplier,
                clubCurrency,
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
