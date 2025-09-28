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
}

interface Props {
    fieldName: string
    placeholder: string
    required?: boolean
    dropdownBillingOptions: BillingOption[]
    currency: string
    onFieldNameChange: (val: string) => void
    onPlaceholderChange: (val: string) => void
    onRequiredChange?: (val: boolean) => void
    onAddBillingOption: (option: BillingOption) => void
    onRemoveBillingOption: (id: string) => void
}

export default function EditBillingDropdown({
    currency,
    fieldName,
    placeholder,
    required = false,
    dropdownBillingOptions,
    onFieldNameChange,
    onRequiredChange,
    onPlaceholderChange,
    onAddBillingOption,
    onRemoveBillingOption,
}: Props) {
    const [internalFieldName, setInternalFieldName] = useState(fieldName)
    const [internalRequired, setInternalRequired] = useState(required)
    const [internalPlaceholder, setInternalPlaceholder] = useState(placeholder)
    const [dropdownLabel, setDropdownLabel] = useState("")
    const [dropdownAmount, setDropdownAmount] = useState(0)

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

    const addDisabled = !dropdownLabel || !dropdownAmount

    const handleAddOption = () => {
        if (addDisabled) return
        onAddBillingOption({
            option_order_id: crypto.randomUUID(),
            label: dropdownLabel,
            amount: dropdownAmount,
        })
        setDropdownLabel("")
        setDropdownAmount(0)
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
                        <Label className="mb-2">Amount {formatAmount(dropdownAmount, currency)}</Label>
                        <Input
                            className="flex-1"
                            type="number"
                            placeholder="Amount"
                            value={dropdownAmount}
                            onChange={(e) => setDropdownAmount(Number(e.target.value))}
                            required
                        />
                    </div>
                    <Button variant="outline" disabled={addDisabled} onClick={handleAddOption}>
                        Add
                    </Button>
                </div>

                {dropdownBillingOptions.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {dropdownBillingOptions.map((option) => (
                            <div
                                key={option.option_order_id}
                                className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded-lg"
                            >
                                <span>
                                    {option.label} {formatAmount(option.amount, currency)}
                                </span>
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
