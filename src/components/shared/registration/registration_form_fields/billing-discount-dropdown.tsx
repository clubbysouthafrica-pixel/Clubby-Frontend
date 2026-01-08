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

interface DiscountOption {
    label: string
    percentage: number
    option_order_id: string
    applicable_billing_fields: string[]
}

interface Field {
    field_id: string
    field_name: string
    field_type: string
    placeholder?: string
    required?: boolean
    value?: string
    discountOptions?: DiscountOption[]
}

interface BillingDiscountDropdownProps {
    field: Field
    currentPageIndex: number
    pages: any[]
    setFieldValue: (
        pageIndex: number,
        fieldId: string,
        updater: (f: any) => any
    ) => void
}

export default function BillingDiscountDropdown({
    field,
    currentPageIndex,
    pages,
    setFieldValue,
}: BillingDiscountDropdownProps) {
    const onDiscountSelect = (label: string) => {
        const option = field.discountOptions?.find((o) => o.label === label)
        setFieldValue(
            pages[currentPageIndex].page_index,
            field.field_id,
            (f) => ({
                ...f,
                value: label,
                percentage: option?.percentage,
                label: option?.label,
                option_order_id: option?.option_order_id,
                applicable_billing_fields: option?.applicable_billing_fields,
            })
        )
    }

    return (
        <div className="grid gap-2" key={field.field_id}>
            <Label>
                {field.field_name}
                {field.required ? <span className="text-red-500">*</span> : null}
            </Label>

            <Select onValueChange={onDiscountSelect} value={field.value}>
                <SelectTrigger className="w-full">
                    <SelectValue
                        placeholder={field.placeholder ?? "Select discount"}
                    />
                </SelectTrigger>

                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>{field.field_name}</SelectLabel>
                        {field.discountOptions?.map((opt) => (
                            <SelectItem key={opt.option_order_id} value={opt.label}>
                                {opt.label} <strong>{opt.percentage === 0 ? "No discount" : `${opt.percentage}% off`}</strong>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
