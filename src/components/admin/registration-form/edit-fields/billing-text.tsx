// FieldNameAmountInput.tsx
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { formatAmount } from "@/data/currencies"

interface Props {
  fieldName: string
  amount: string | number
  required?: boolean
  onFieldNameChange: (val: string) => void
  onAmountChange: (val: number) => void
  onRequiredChange?: (val: boolean) => void
}

export default function EditBillingText({
  fieldName,
  amount,
  required = false,
  onFieldNameChange,
  onAmountChange,
  onRequiredChange,
}: Props) {
  const [internalFieldName, setInternalFieldName] = useState(fieldName)
  const [internalAmount, setInternalAmount] = useState(amount)
  const [internalRequired, setInternalRequired] = useState(required)

  useEffect(() => setInternalFieldName(fieldName), [fieldName])
  useEffect(() => setInternalAmount(amount), [amount])
  useEffect(() => setInternalRequired(required), [required])

  const handleFieldNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFieldName(e.target.value)
    onFieldNameChange(e.target.value)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalAmount(e.target.value)
    onAmountChange(Number(e.target.value))
  }

  const handleRequiredChange = (checked: boolean) => {
    setInternalRequired(checked)
    if (onRequiredChange) onRequiredChange(checked)
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
        <Label className="block text-sm font-medium mb-2">Amount</Label>
        <div className='flex-1'>
          {formatAmount(Number(internalAmount), "ZAR")}
          <Input
            required
            type="text"
            value={internalAmount}
            onChange={handleAmountChange}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Checkbox
          checked={internalRequired}
          onCheckedChange={handleRequiredChange}
        />
        <Label>Is required</Label>
      </div>
    </div>
  )
}
