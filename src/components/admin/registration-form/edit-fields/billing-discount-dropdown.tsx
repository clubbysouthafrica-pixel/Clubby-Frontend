import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"
import { InputFormRegistration } from "@/interfaces/formRegistration"

export interface DiscountOption {
    option_order_id: string
    label: string
    percentage: number
    applicable_billing_fields: string[] // field_ids of billing fields this discount applies to
}

interface Props {
    fieldName: string
    placeholder: string
    required?: boolean
    discountOptions: DiscountOption[]
    allBillingFields: InputFormRegistration[] // All billing fields from the entire form
    onFieldNameChange: (val: string) => void
    onPlaceholderChange: (val: string) => void
    onRequiredChange?: (val: boolean) => void
    onAddDiscountOption: (option: DiscountOption) => void
    onRemoveDiscountOption: (id: string) => void
}

export default function EditBillingDiscountDropdown({
    fieldName,
    placeholder,
    required = false,
    discountOptions,
    allBillingFields,
    onFieldNameChange,
    onRequiredChange,
    onPlaceholderChange,
    onAddDiscountOption,
    onRemoveDiscountOption,
}: Props) {
    const [internalFieldName, setInternalFieldName] = useState(fieldName)
    const [internalRequired, setInternalRequired] = useState(required)
    const [internalPlaceholder, setInternalPlaceholder] = useState(placeholder)
    const [discountLabel, setDiscountLabel] = useState("")
    const [discountPercentage, setDiscountPercentage] = useState<number>(0)
    const [selectedBillingFields, setSelectedBillingFields] = useState<string[]>([])

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

    const handleBillingFieldToggle = (fieldId: string) => {
        setSelectedBillingFields(prev => 
            prev.includes(fieldId)
                ? prev.filter(id => id !== fieldId)
                : [...prev, fieldId]
        )
    }

    const addDisabled = !discountLabel || discountPercentage < 0 || discountPercentage > 100 || selectedBillingFields.length === 0

    const handleAddOption = () => {
        if (addDisabled) return

        onAddDiscountOption({
            option_order_id: crypto.randomUUID(),
            label: discountLabel,
            percentage: discountPercentage,
            applicable_billing_fields: selectedBillingFields,
        })

        setDiscountLabel("")
        setDiscountPercentage(0)
        setSelectedBillingFields([])
    }

    const getBillingFieldLabel = (fieldId: string) => {
        const field = allBillingFields.find(f => f.field_id === fieldId)
        return field?.field_name || field?.field_text || 'Unknown Field'
    }

    return (
        <div className="flex flex-col h-full max-h-[60vh]">
            {/* Fixed top section - basic field settings */}
            <div className="flex-shrink-0 space-y-4 pb-4">
                <div>
                    <Label className="block text-sm font-medium mb-2">Field Name</Label>
                    <Input type="text" value={internalFieldName} onChange={handleFieldNameChange} required />
                </div>

                <div>
                    <Label className="block text-sm font-medium mb-2">Placeholder</Label>
                    <Input required type="text" value={internalPlaceholder} onChange={handlePlaceholderChange} />
                </div>

                <div className="flex items-center gap-3">
                    <Checkbox checked={internalRequired} onCheckedChange={handleRequiredChange} />
                    <Label>Is required</Label>
                </div>

                <Label className="block text-sm font-medium">Discount Options</Label>
                
                <div className="space-y-3">
                    <div className="flex space-x-2 items-end">
                        <Input
                            className="flex-1"
                            type="text"
                            placeholder="Discount Label (e.g., Student Discount)"
                            value={discountLabel}
                            onChange={(e) => setDiscountLabel(e.target.value)}
                            required
                        />
                        <div className='flex-1'>
                            <Input
                                className="flex-1"
                                type="number"
                                placeholder="Percentage (0-100)"
                                value={discountPercentage || ""}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0
                                    setDiscountPercentage(Math.min(100, Math.max(0, val)))
                                }}
                                min={0}
                                max={100}
                                required
                            />
                        </div>
                    </div>

                    {allBillingFields.length > 0 ? (
                        <div className="border rounded-lg p-3 bg-gray-50">
                            <Label className="block text-xs font-medium mb-2">Apply discount to these billing fields:</Label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {allBillingFields.map((field) => (
                                    <div key={field.field_id} className="flex items-center gap-2">
                                        <Checkbox 
                                            checked={selectedBillingFields.includes(field.field_id!)}
                                            onCheckedChange={() => handleBillingFieldToggle(field.field_id!)}
                                        />
                                        <Label className="text-sm cursor-pointer" onClick={() => handleBillingFieldToggle(field.field_id!)}>
                                            {field.field_name || field.field_text}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-lg p-3 bg-yellow-50 text-yellow-800 text-sm">
                            No billing fields exist yet. Add billing fields to the form first before creating discounts.
                        </div>
                    )}

                    <Button 
                        variant="outline" 
                        disabled={addDisabled} 
                        onClick={handleAddOption}
                        className="w-full"
                    >
                        Add Discount Option
                    </Button>
                </div>
            </div>

            {/* Scrollable section - configured discounts list */}
            {discountOptions.length > 0 && (
                <div className="flex-1 min-h-[100px] overflow-y-auto pr-2 space-y-2 min-h-0 pt-4 border-t">
                    <Label className="block text-xs font-medium mb-2">Configured Discounts:</Label>
                    <div className="space-y-2">
                        {discountOptions.map((option) => (
                            <div
                                key={option.option_order_id}
                                className="flex flex-col gap-2 bg-gray-50 px-3 py-2 rounded-lg"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                        {option.label} <strong>({option.percentage}% off)</strong>
                                    </span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => onRemoveDiscountOption(option.option_order_id)}
                                    >
                                        <XIcon />
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Applies to: {option.applicable_billing_fields.map(id => getBillingFieldLabel(id)).join(', ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
