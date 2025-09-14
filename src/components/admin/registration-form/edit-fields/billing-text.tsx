// FieldNameAmountInput.tsx
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatAmount } from "@/data/currencies"

interface Props {
  currency: string;
  fieldName: string
  amount: string | number
  required?: boolean
  onFieldNameChange: (val: string) => void
  onAmountChange: (val: number) => void
  onRequiredChange?: (val: boolean) => void
}

export default function EditBillingText({
  currency,
  fieldName,
  amount,
  onFieldNameChange,
  onAmountChange
}: Props) {
  const [internalFieldName, setInternalFieldName] = useState(fieldName)
  const [internalAmount, setInternalAmount] = useState(amount)

  useEffect(() => setInternalFieldName(fieldName), [fieldName])
  useEffect(() => setInternalAmount(amount), [amount])

  const handleFieldNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFieldName(e.target.value)
    onFieldNameChange(e.target.value)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalAmount(e.target.value)
    onAmountChange(Number(e.target.value))
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
          {formatAmount(Number(internalAmount), currency)}
          <Input
            required
            type="text"
            value={internalAmount}
            onChange={handleAmountChange}
          />
        </div>
      </div>
    </div>
  )
}
