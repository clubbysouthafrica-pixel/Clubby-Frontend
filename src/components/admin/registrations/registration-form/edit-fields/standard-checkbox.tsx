import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface Props {
  fieldName: string
  placeholder: string
  required?: boolean
  editable_by_member?: boolean
  onFieldNameChange: (val: string) => void
  onPlaceholderChange: (val: string) => void
  onRequiredChange?: (val: boolean) => void
  onEditable_by_memberChange?: (val: boolean) => void
}

export default function EditStandardCheckbox({
  fieldName,
  placeholder,
  required = false,
  editable_by_member = false,
  onFieldNameChange,
  onPlaceholderChange,
  onRequiredChange,
  onEditable_by_memberChange,
}: Props) {
  const [internalFieldName, setInternalFieldName] = useState(fieldName)
  const [internalPlaceholder, setInternalPlaceholder] = useState(placeholder)
  const [internalRequired, setInternalRequired] = useState(required)
  const [internalEditable_by_member, setInternalEditable_by_member] = useState(editable_by_member)

  // Keep internal state in sync with props
  useEffect(() => setInternalFieldName(fieldName), [fieldName])
  useEffect(() => setInternalPlaceholder(placeholder), [placeholder])
  useEffect(() => setInternalRequired(required), [required])
  useEffect(() => setInternalEditable_by_member(editable_by_member), [editable_by_member])

  // Auto-disable editable_by_member when required is true
  useEffect(() => {
    if (internalRequired) {
      setInternalEditable_by_member(false)
      if (onEditable_by_memberChange) onEditable_by_memberChange(false)
    }
  }, [internalRequired])

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

  const handleEditable_by_memberChange = (checked: boolean) => {
    setInternalEditable_by_member(checked)
    if (onEditable_by_memberChange) onEditable_by_memberChange(checked)
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

      <div className="flex items-center gap-3 mt-4">
        <Checkbox
          checked={internalEditable_by_member}
          onCheckedChange={handleEditable_by_memberChange}
          disabled={internalRequired}
        />
        <Label className={internalRequired ? "text-gray-400" : ""}>Editable by member post registration</Label>
      </div>
    </div>
  )
}
