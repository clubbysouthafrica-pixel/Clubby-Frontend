import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface Props {
  fieldName: string
  placeholder: string
  required?: boolean
  onFieldNameChange: (val: string) => void
  onPlaceholderChange: (val: string) => void
  onRequiredChange?: (val: boolean) => void
}

export default function EditStandardCheckbox({
  fieldName,
  placeholder,
  required = false,
  onFieldNameChange,
  onPlaceholderChange,
  onRequiredChange,
}: Props) {
  const [internalFieldName, setInternalFieldName] = useState(fieldName)
  const [internalPlaceholder, setInternalPlaceholder] = useState(placeholder)
  const [internalRequired, setInternalRequired] = useState(required)

  // Keep internal state in sync with props
  useEffect(() => setInternalFieldName(fieldName), [fieldName])
  useEffect(() => setInternalPlaceholder(placeholder), [placeholder])
  useEffect(() => setInternalRequired(required), [required])

  const handleFieldNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFieldName(e.target.value)
    onFieldNameChange(e.target.value)
  }

  const handlePlaceholderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalPlaceholder(e.target.value)
    onPlaceholderChange(e.target.value)
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
        <Label className="block text-sm font-medium mb-2">Placeholder</Label>
        <Input
          required
          type="text"
          value={internalPlaceholder}
          onChange={handlePlaceholderChange}
        />
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Checkbox
          checked={internalRequired}
          onCheckedChange={handleRequiredChange}
        />
        <Label>Is required</Label>
      </div>
    </div>
  )
}
