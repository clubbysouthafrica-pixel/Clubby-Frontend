import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatAmount } from "@/data/currencies"

interface BillingOption {
    label: string
    amount: number
    option_order_id: string
}

interface Field {
    field_id: string
    field_name: string
    field_type: string
    placeholder?: string
    required?: boolean
    value?: string
    billingOptions?: BillingOption[]
}

interface BillingSelectFieldProps {
    field: Field
    clubCurrency: string
    currentPageIndex: number
    pages: any[]
    setFieldValue: (
        pageIndex: number,
        fieldId: string,
        updater: (f: any) => any
    ) => void
}

export default function BillingDropdown({
    field,
    clubCurrency,
    currentPageIndex,
    pages,
    setFieldValue,
}: BillingSelectFieldProps) {
    const onBillingSelect = (label: string) => {
        const option = field.billingOptions?.find((o) => o.label === label)
        setFieldValue(
            pages[currentPageIndex].page_index,
            field.field_id,
            (f) => ({
                ...f,
                value: label,
                selectedAmountCents: option?.amount,
                label: option?.label,
                option_order_id: option?.option_order_id,
            })
        )
    }

    return (
        <div className="grid gap-2" key={field.field_id}>
            <Label>
                {field.field_name}
                {field.required ? <span className="text-red-500">*</span> : null}
            </Label>

            <Select onValueChange={onBillingSelect} value={field.value}>
                <SelectTrigger className="w-full">
                    <SelectValue
                        placeholder={field.placeholder ?? "Select membership type"}
                    />
                </SelectTrigger>

                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>{field.field_name}</SelectLabel>
                        {field.billingOptions?.map((opt) => (
                            <SelectItem key={opt.option_order_id} value={opt.label}>
                                {opt.label} ({formatAmount(opt.amount, clubCurrency)})
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
