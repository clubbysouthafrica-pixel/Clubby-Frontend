import { Input } from "@/components/ui/input";
import { formatAmount } from "@/data/currencies";
import { useEffect, useState } from "react";
import { formatProrataPercentage, getActiveProrataRule, getProratedAmount, isProrataActive } from "@/lib/billing-prorata";
import RequiredLabel from "./required-label";

interface Field {
    field_id: string
    field_order_id: string
    field_name: string
    field_type: "TEXT" | "STANDARD" | "BILLING"
    input_type: "TEXT" | "DROPDOWN" | "CHECKBOX" | "NUMBER" | "SIGNATURE"
    placeholder?: string
    required?: boolean
    multiplier?: boolean
    multiplier_value?: number
    value?: string | number;
    amount?: number;
    prorata?: {
      enabled?: boolean;
      rules?: Array<{
        id?: string;
        prorata_start_date: string;
        prorata_end_date: string;
        prorata_percentage: number;
      }>;
    };
}

interface Page {
    page_index: number;
}

interface BillingSelectFieldProps {
    field: Field
    clubCurrency: string | undefined
    currentPageIndex: number
    pages: Page[]
    setFieldValue: (
        pageIndex: number,
        fieldId: string,
      updater: (f: Field) => Field
    ) => void
}

export default function BillingText({
    field,
    clubCurrency,
    currentPageIndex,
    pages,
    setFieldValue,
}: BillingSelectFieldProps) {
  const baseAmount = field.amount ?? 0;
  const adjustedUnitAmount = getProratedAmount(baseAmount, field);
  const hasActiveProrata = isProrataActive(field);
  const activeProrataRule = getActiveProrataRule(field);

    const getMinimumMultiplier = () => (field?.multiplier && field?.required ? 1 : 0);

    const getNormalizedMultiplier = () => {
      const minimumMultiplier = getMinimumMultiplier();

      if (!field?.multiplier) {
        return 0;
      }

      if (typeof field?.multiplier_value === "number") {
        return Math.max(minimumMultiplier, field.multiplier_value);
      }

      return minimumMultiplier;
    };

    const [multiplier, setMultiplier] = useState(getNormalizedMultiplier);

    useEffect(() => {
      const minimumMultiplier = field?.multiplier && field?.required ? 1 : 0;
      const normalizedMultiplier = !field?.multiplier
        ? 0
        : typeof field?.multiplier_value === "number"
          ? Math.max(minimumMultiplier, field.multiplier_value)
          : minimumMultiplier;

      setMultiplier(normalizedMultiplier);
    }, [field?.multiplier, field?.multiplier_value, field?.required]);

  useEffect(() => {
    if (!field?.multiplier || multiplier <= 0) {
      return;
    }

    const nextValue = adjustedUnitAmount * multiplier;

    if (field.value === nextValue) {
      return;
    }

    setFieldValue(
      pages[currentPageIndex].page_index,
      field.field_id,
      (f) => ({
        ...f,
        value: nextValue,
        multiplier_value: multiplier,
      }),
    );
  }, [adjustedUnitAmount, currentPageIndex, field.field_id, field.multiplier, field.value, multiplier, pages, setFieldValue]);

    const onChange = (multiplier_value: number) => {
        if (multiplier_value === 0) {
            setFieldValue(
                pages[currentPageIndex].page_index,
                field.field_id,
                (f) => ({
                    ...f,
                    value: undefined,
                })
            );
        } else {
            setFieldValue(
                pages[currentPageIndex].page_index,
                field.field_id,
                (f) => ({
                    ...f,
                  value: adjustedUnitAmount * multiplier_value,
                    multiplier_value,
                })
            );
        }
    };

    if (!field?.multiplier) {
        return (
        <p key={field.field_id} className="text-base font-medium text-gray-900">
          {field.field_name}
          {field.required && <span className="sr-only"> required</span>}
          :{" "}
                <span className="font-semibold">
                    {formatAmount(adjustedUnitAmount, clubCurrency)}
                </span>
                {hasActiveProrata && adjustedUnitAmount !== baseAmount && (
                    <span className="ml-2 text-sm font-normal text-emerald-700">
                  {activeProrataRule ? formatProrataPercentage(activeProrataRule.prorata_percentage) : "0.00"}% prorata discount active from {activeProrataRule?.prorata_start_date} to {activeProrataRule?.prorata_end_date}. Reduced from {formatAmount(baseAmount, clubCurrency)}
                    </span>
                )}
            </p>
        );
    }

    return (
      <div
        key={field.field_id}
        className="flex flex-col gap-2 py-2 sm:py-1"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
          <RequiredLabel className="text-base font-medium text-gray-900 whitespace-nowrap">
            {field.field_name}{" "}
            <span className="text-gray-600 font-normal">
              ({formatAmount(adjustedUnitAmount, clubCurrency)} each)
            </span>
            {field.required && <span className="sr-only"> required</span>}
          </RequiredLabel>

          <div className="flex items-center gap-1">
            <span className="text-gray-900 font-medium">×</span>
            <Input
              type="number"
              value={multiplier}
              min={getMinimumMultiplier().toString()}
              onChange={(e) => {
                const rawValue = parseInt(e.target.value);
                const minValue = getMinimumMultiplier();
                const val = isNaN(rawValue) ? minValue : Math.max(minValue, rawValue);
                setMultiplier(val);
                onChange(val);
              }}
              onInvalid={(e) => e.preventDefault()}
              className="w-16 h-8 text-center text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              style={{
                MozAppearance: "textfield",
                WebkitAppearance: "none",
                margin: 0,
              }}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-600 font-medium">=</span>
            <span className="font-semibold text-base text-gray-900 whitespace-nowrap">
              {formatAmount(adjustedUnitAmount * multiplier, clubCurrency)}
            </span>
          </div>
        </div>

        {hasActiveProrata && adjustedUnitAmount !== baseAmount && (
          <p className="text-sm text-emerald-700">
            {activeProrataRule ? formatProrataPercentage(activeProrataRule.prorata_percentage) : "0.00"}% prorata discount active from {activeProrataRule?.prorata_start_date} to {activeProrataRule?.prorata_end_date}. Reduced from {formatAmount(baseAmount, clubCurrency)} each
          </p>
        )}
      </div>
    );
}
