import { Input } from "@/components/ui/input";
import { formatAmount } from "@/data/currencies";
import { useState } from "react";

interface Field {
    field_id: string
    field_name: string
    field_type: string
    placeholder?: string
    required?: boolean
    multiplier?: boolean
    multiplier_value?: number
    value?: string;
    amount?: number;
}

interface BillingSelectFieldProps {
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

export default function BillingText({
    field,
    clubCurrency,
    currentPageIndex,
    pages,
    setFieldValue,
}: BillingSelectFieldProps) {
    const [multiplier, setMultiplier] = useState(field?.multiplier_value ? field?.multiplier_value :
        field?.multiplier && field?.required ? 1 : 0
    );

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
                    value: (field.amount ?? 0) * multiplier_value,
                    multiplier_value,
                })
            );
        }
    };

    if (!field?.multiplier) {
        return (
            <p key={field.field_id}>
                {field.field_name}:{" "}
                <span className="font-semibold">
                    {formatAmount(field.amount ?? 0, clubCurrency)}
                </span>
            </p>
        );
    }

    return (
        <div
            className="flex items-center gap-4 py-2"
            key={field.field_id}
        >
            <p className="text-sm font-medium whitespace-nowrap">
                {field.field_name}{" "}
                <span className="text-gray-500 font-normal">
                    ({formatAmount(field.amount ?? 0, clubCurrency)} each)
                </span>
            </p>
            <span className="text-gray-1000 font-medium">×</span>
            <div className="flex items-center space-x-1">
                <Input
                    type="number"
                    value={multiplier}
                    min={field?.multiplier && field?.required ? "1" : "0"}
                    onChange={(e) => {
                        const rawValue = parseInt(e.target.value);
                        const minValue = field?.multiplier && field?.required ? 1 : 0;
                    
                        const val = isNaN(rawValue) ? minValue : Math.max(minValue, rawValue);
                    
                        setMultiplier(val);
                        onChange(val);
                    }}
                    className="w-18 h-8 text-center text-sm border-gray-500 rounded-sm"
                    style={{
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                        margin: 0,
                    }}
                />
            </div>
            <span className="text-gray-500 font-medium">=</span>
            <span className="font-semibold text-sm whitespace-nowrap">
                {formatAmount((field.amount ?? 0) * multiplier, clubCurrency)}
            </span>
        </div>

    );
}
