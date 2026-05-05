import { Input } from "@/components/ui/input";
import { formatAmount } from "@/data/currencies";
import { formatProrataPercentage, getActiveProrataRule, getProratedAmount, isProrataActive } from "@/lib/billing-prorata";
import { useMemo, useState } from "react";
import RequiredLabel from "./required-label";

interface Field {
    field_id: string
    field_name: string
    field_type: string
    placeholder?: string
    required?: boolean
    value?: string | number;
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

interface BillingNumberFieldProps {
    field: Field
    clubCurrency: string | undefined
    currentPageIndex: number
    pages: any[]
    setFieldValue: (
        pageIndex: number,
        fieldId: string,
        updater: (f: any) => any
    ) => void
}

export default function BillingNumber({
    field,
    clubCurrency,
    currentPageIndex,
    pages,
    setFieldValue,
}: BillingNumberFieldProps) {
    const initialRawAmount = typeof field.value === "string"
        ? parseFloat(field.value)
        : field.value ?? 0;
    const [rawAmount, setRawAmount] = useState(initialRawAmount);
    const [displayAmount, setDisplayAmount] = useState(
        formatAmount(initialRawAmount, clubCurrency),
    );
    const adjustedAmount = useMemo(
        () => getProratedAmount(rawAmount, field),
        [field, rawAmount],
    );
    const hasActiveProrata = isProrataActive(field);
    const activeProrataRule = getActiveProrataRule(field);

    const handleFormattedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value.replace(/[^\d]/g, "");
        const value = parseInt(inputValue || "0", 10);

        setRawAmount(value);
        setDisplayAmount(formatAmount(value, clubCurrency));

        if (!value || value <= 0) {
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
                    value: getProratedAmount(value, f),
                })
            );
        }
    };

    return (
        <div className="space-y-2" key={field.field_id}>
            <RequiredLabel htmlFor={field.field_id} required={field.required} className="block text-base font-medium text-gray-900">
                {field.field_name}
            </RequiredLabel>
            <div className="flex items-center gap-2">
                <Input
                    id={field.field_id}
                    type="text"
                    value={displayAmount}
                    placeholder={field.placeholder ?? "Enter amount"}
                    onChange={handleFormattedInputChange}
                    onInvalid={(e) => e.preventDefault()}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2.5 text-base font-normal focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
            </div>
            {hasActiveProrata && rawAmount > 0 && adjustedAmount !== rawAmount && (
                <p className="text-sm text-emerald-700">
                    {activeProrataRule ? formatProrataPercentage(activeProrataRule.prorata_percentage) : "0.00"}% prorata discount active. {formatAmount(adjustedAmount, clubCurrency)} payable from {formatAmount(rawAmount, clubCurrency)}
                </p>
            )}
        </div>
    );
}
