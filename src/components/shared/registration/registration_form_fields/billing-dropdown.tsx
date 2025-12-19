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
import { useState, useEffect } from "react"

interface BillingOption {
    label: string
    amount: number
    option_order_id: string
    multiplier?: boolean
}

interface Field {
    field_id: string
    field_name: string
    field_type: string
    placeholder?: string
    required?: boolean
    value?: string
    billingOptions?: BillingOption[]
    multiplier_value?: number
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

export default function BillingDropdown({
    field,
    clubCurrency,
    currentPageIndex,
    pages,
    setFieldValue,
}: BillingSelectFieldProps) {
    const [multiplier, setMultiplier] = useState(
        field?.multiplier_value ? field?.multiplier_value : 1
    )
    const [isOpen, setIsOpen] = useState(false)

    const selectedOption = field.billingOptions?.find((o) => o.label === field.value)

    useEffect(() => {
        if (field?.multiplier_value) {
            setMultiplier(field?.multiplier_value)
        }
    }, [field?.multiplier_value, field?.value])

    const onBillingSelect = (label: string) => {
        // If "undefined" is selected, set value to empty string
        const valueToSet = label === "undefined" ? "" : label
        const option = field.billingOptions?.find((o) => o.label === valueToSet)
        setMultiplier(1)
        setFieldValue(
            pages[currentPageIndex].page_index,
            field.field_id,
            (f) => ({
                ...f,
                value: valueToSet,
                selectedAmountCents: option?.amount,
                label: option?.label,
                option_order_id: option?.option_order_id,
                multiplier_value: undefined,
            })
        )
    }

    const onMultiplierChange = (multiplier_value: number) => {
        if (multiplier_value === 0 || !selectedOption) {
            setFieldValue(
                pages[currentPageIndex].page_index,
                field.field_id,
                (f) => ({
                    ...f,
                    multiplier_value: undefined,
                })
            )
        } else {
            setFieldValue(
                pages[currentPageIndex].page_index,
                field.field_id,
                (f) => ({
                    ...f,
                    selectedAmountCents: (selectedOption?.amount ?? 0) * multiplier_value,
                    multiplier_value,
                })
            )
        }
    }

    return (
        <div className="grid gap-2" key={field.field_id}>
            <Label>
                {field.field_name}
                {field.required ? <span className="text-red-500">*</span> : null}
            </Label>

            <div className="space-y-0">
                <Select onValueChange={onBillingSelect} value={field.value || "undefined"} open={isOpen} onOpenChange={setIsOpen}>
                    <SelectTrigger className={selectedOption?.multiplier && field.value ? "w-full rounded-b-none border-b-0" : "w-full"}>
                        <SelectValue placeholder={field.placeholder ?? "Select membership type"} />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="undefined" className="text-muted-foreground">
                                -- Not Selected --
                            </SelectItem>
                            <SelectLabel className="text-muted-foreground/60">{field.field_name}</SelectLabel>
                            {field.billingOptions?.map((opt) => (
                                <SelectItem key={opt.option_order_id} value={opt.label}>
                                    <div className="flex flex-col gap-1 py-2 w-full">
                                        <div className="flex items-center gap-2">
                                            <span>
                                                {opt.label} <strong>({opt.amount == 0 ? "FREE" : formatAmount(opt.amount, clubCurrency)})</strong>
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
                        className="flex flex-wrap items-center gap-2 px-3 py-2 border border-t-0 border-input rounded-b-md bg-white"
                        onClick={(e) => {
                            if (!(e.target instanceof HTMLInputElement)) {
                                setIsOpen(true)
                            }
                        }}
                    >
                        <p className="text-sm font-medium">
                           {selectedOption.label}
                        </p>
                        <span className="text-gray-1000 font-medium">×</span>
                        <input
                            type="number"
                            value={multiplier}
                            min="1"
                            onChange={(e) => {
                                const rawValue = parseInt(e.target.value)
                                const val = isNaN(rawValue) ? 1 : Math.max(1, rawValue)
                                setMultiplier(val)
                                onMultiplierChange(val)
                            }}
                            className="w-16 h-7 px-2 text-center text-sm border border-gray-500 rounded-sm flex-shrink-0"
                            style={{
                                MozAppearance: "textfield",
                                WebkitAppearance: "none",
                                margin: 0,
                            }}
                        />
                        <span className="text-gray-500 font-medium">=</span>
                        <span className="font-semibold text-sm">
                            {formatAmount((selectedOption?.amount ?? 0) * multiplier, clubCurrency)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
