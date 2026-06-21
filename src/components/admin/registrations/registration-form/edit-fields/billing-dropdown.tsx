import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"
import { formatAmount } from "@/data/currencies"

export interface BillingOption {
    option_order_id: string
    label: string
    amount: number
    multiplier?: boolean
}

interface Props {
    fieldName: string
    placeholder: string
    required?: boolean
    dropdownBillingOptions: BillingOption[]
    currency: string
    // multiplier: boolean
    onFieldNameChange: (val: string) => void
    onPlaceholderChange: (val: string) => void
    onRequiredChange?: (val: boolean) => void
    onAddBillingOption: (option: BillingOption) => void
    onRemoveBillingOption: (id: string) => void
    onUpdateBillingOption?: (option: BillingOption) => void
    // onMultiplierChange: (val: boolean) => void
}

export default function EditBillingDropdown({
    currency,
    fieldName,
    placeholder,
    required = false,
    dropdownBillingOptions,
    // multiplier = false,
    // onMultiplierChange,
    onFieldNameChange,
    onRequiredChange,
    onPlaceholderChange,
    onAddBillingOption,
    onRemoveBillingOption,
    onUpdateBillingOption,
}: Props) {
    const [internalFieldName, setInternalFieldName] = useState(fieldName)
    const [internalRequired, setInternalRequired] = useState(required)
    const [internalPlaceholder, setInternalPlaceholder] = useState(placeholder)
    const [dropdownLabel, setDropdownLabel] = useState("")
    const [dropdownAmountRaw, setDropdownAmountRaw] = useState<number>(0)
    const [dropdownAmountDisplay, setDropdownAmountDisplay] = useState<string>(formatAmount(0, currency))
    const [dropdownMultiplier, setDropdownMultiplier] = useState(false)

    useEffect(() => setInternalFieldName(fieldName), [fieldName])
    useEffect(() => setInternalRequired(required), [required])
    useEffect(() => setInternalPlaceholder(placeholder), [placeholder])

    const handleFieldNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInternalFieldName(e.target.value)
        onFieldNameChange(e.target.value)
    }

    const handleRequiredChange = (checked: boolean) => {
        setInternalRequired(checked)
        if (onRequiredChange) onRequiredChange(checked)
    }

    const handlePlaceholderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInternalPlaceholder(e.target.value)
        onPlaceholderChange(e.target.value)
    }

    const addDisabled = !dropdownLabel || dropdownAmountRaw < 0

    const handleAddOption = () => {
        if (addDisabled) return

        onAddBillingOption({
            option_order_id: crypto.randomUUID(),
            label: dropdownLabel,
            amount: dropdownAmountRaw,
            multiplier: dropdownMultiplier,
        })

        setDropdownLabel("")
        setDropdownAmountRaw(0)
        setDropdownAmountDisplay(formatAmount(0, currency))
        setDropdownMultiplier(false)
    }

    return (
        <div className="space-y-4">
            <div>
                <Label className="block text-sm font-medium mb-2">Field Name</Label>
                <Input type="text" value={internalFieldName} onChange={handleFieldNameChange} required />
            </div>

            <div>
                <Label className="block text-sm font-medium mb-2">Placeholder</Label>
                <Input required type="text" value={internalPlaceholder} onChange={handlePlaceholderChange} />
            </div>

            <div className="flex items-center gap-3 mt-2">
                <Checkbox checked={internalRequired} onCheckedChange={handleRequiredChange} />
                <Label>Is required</Label>
            </div>
            {/* <div className="flex items-center gap-3 mt-2">
                <Checkbox checked={internalMultiplier} onCheckedChange={handleMultiplierChange} />
                <Label>Multiplier</Label>
            </div> */}

            <div>
                <Label className="block text-sm font-medium my-4">Options</Label>
                <div className="flex space-x-2 items-end">

                    <Input
                        className="flex-1"
                        type="text"
                        placeholder="Label"
                        value={dropdownLabel}
                        onChange={(e) => setDropdownLabel(e.target.value)}
                        required
                    />
                    <div className='flex-1'>
                        <Input
                            className="flex-1"
                            type="text"
                            placeholder="Amount"
                            value={dropdownAmountDisplay}
                            onChange={(e) => {
                                const cleaned = e.target.value.replace(/[^\d]/g, "")
                                const numeric = parseInt(cleaned || "0", 10)
                                setDropdownAmountRaw(numeric)
                                setDropdownAmountDisplay(formatAmount(numeric, currency))
                            }}
                            required
                        />
                    </div>
                    <Button variant="outline" disabled={addDisabled} onClick={handleAddOption}>
                        Add
                    </Button>
                </div>

                <div className="flex items-center gap-2 mt-3 ml-2">
                    <Checkbox
                        checked={dropdownMultiplier}
                        onCheckedChange={(checked) => setDropdownMultiplier(checked === true)}
                    />
                    <Label className="text-xs cursor-pointer">Multiplier</Label>
                </div>

                {dropdownBillingOptions.length > 0 && (
                    <div className={dropdownBillingOptions.length > 5 ? "mt-2 space-y-2 max-h-[400px] overflow-y-auto" : "mt-2 space-y-2"}>
                        {dropdownBillingOptions.map((option) => (
                            <div
                                key={option.option_order_id}
                                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg gap-3"
                            >
                                <div className="flex-1">
                                    <span>
                                        {option.label} <strong>({option.amount == 0 ? "FREE" : formatAmount(option.amount, currency)})</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                        checked={option.multiplier || false} 
                                        onCheckedChange={(checked) => {
                                            if (onUpdateBillingOption) {
                                                onUpdateBillingOption({
                                                    ...option,
                                                    multiplier: checked === true
                                                })
                                            }
                                        }} 
                                    />
                                    <Label className="text-xs whitespace-nowrap cursor-pointer">Multiplier</Label>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onRemoveBillingOption(option.option_order_id)}
                                >
                                    <XIcon />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
