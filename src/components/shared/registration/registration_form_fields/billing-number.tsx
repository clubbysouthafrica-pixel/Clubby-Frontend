import { Input } from "@/components/ui/input";
import { formatAmount } from "@/data/currencies";
import { useState } from "react";

interface Field {
    field_id: string
    field_name: string
    field_type: string
    placeholder?: string
    required?: boolean
    value?: string | number;
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
    const [displayAmount, setDisplayAmount] = useState(
        field?.value ? formatAmount(typeof field.value === 'string' ? parseFloat(field.value) : field.value, clubCurrency) : formatAmount(0, clubCurrency)
    );

    const handleFormattedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value.replace(/[^\d]/g, "");
        const value = parseInt(inputValue || "0", 10);

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
                    value: value,
                })
            );
        }
    };

    return (
        <div className="grid gap-2" key={field.field_id}>
            <label className="text-sm font-medium">
                {field.field_name}
                {field.required ? <span className="text-red-500"> *</span> : null}
            </label>
            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    value={displayAmount}
                    placeholder={field.placeholder ?? "Enter amount"}
                    onChange={handleFormattedInputChange}
                    className="flex-1"
                />
            </div>
        </div>
    );
}
