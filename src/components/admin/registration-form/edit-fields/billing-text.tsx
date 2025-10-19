// FieldNameAmountInput.tsx
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatAmount } from "@/data/currencies"
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  currency: string;
  fieldName: string
  amount: string | number
  required: boolean
  multiplier: boolean
  onFieldNameChange: (val: string) => void
  onAmountChange: (val: number) => void
  onRequiredChange: (val: boolean) => void
  onMultiplierChange: (val: boolean) => void
}

export default function EditBillingText({
  currency,
  fieldName,
  amount,
  required = false,
  multiplier = false,
  onMultiplierChange,
  onFieldNameChange,
  onRequiredChange,
  onAmountChange
}: Props) {
  const [internalFieldName, setInternalFieldName] = useState(fieldName)
  const [internalAmountDisplay, setInternalAmountDisplay] = useState(formatAmount(Number(amount), currency))
  const [internalRequired, setInternalRequired] = useState(required)
  const [internalMultiplier, setInternalMultiplier] = useState(multiplier)

  useEffect(() => setInternalFieldName(fieldName), [fieldName])
  useEffect(() => {
    const num = Number(amount)
    setInternalAmountDisplay(formatAmount(num, currency))
  }, [amount, currency])

  const handleFieldNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFieldName(e.target.value)
    onFieldNameChange(e.target.value)
  }

  const handleRequiredChange = (checked: boolean) => {
    if (!internalMultiplier && !checked) return
    setInternalRequired(checked)
    if (onRequiredChange) onRequiredChange(checked)
  }

  const handleMultiplierChange = (checked: boolean) => {
    setInternalMultiplier(checked)
    if (!checked) { 
      setInternalRequired(true)
      onRequiredChange(true) 
      onMultiplierChange(false)
    } else {
      onMultiplierChange(true)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, "")
    const numeric = parseInt(cleaned || "0", 10)
    setInternalAmountDisplay(formatAmount(numeric, currency))
    onAmountChange(numeric)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium mb-2">Field Name</Label>
        <Input
          required
          type="text"
          value={internalFieldName}
          onChange={handleFieldNameChange}
        />
      </div>

      <div>
        <div className='flex-1'>
          <Input
            required
            type="text"
            value={internalAmountDisplay}
            onChange={handleAmountChange}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Checkbox checked={internalRequired} onCheckedChange={handleRequiredChange} />
        <Label>Is required</Label>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Checkbox checked={internalMultiplier} onCheckedChange={handleMultiplierChange} />
        <Label>Multiplier</Label>
      </div>
    </div>
  )
}
