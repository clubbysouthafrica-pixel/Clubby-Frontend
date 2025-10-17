import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Props {
  required?: boolean
  fieldName: string
  onFieldNameChange: (val: string) => void
  onRequiredChange?: (val: boolean) => void
}

export default function EditStandardSignature({
  required = false,
  fieldName,
  onFieldNameChange,
  onRequiredChange,
}: Props) {
  const [internalRequired, setInternalRequired] = useState(required)
  const [internalFieldName, setInternalFieldName] = useState(fieldName)

  useEffect(() => setInternalRequired(required), [required])

  const handleFieldNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFieldName(e.target.value)
    onFieldNameChange(e.target.value)
  }

  const handleRequiredChange = (checked: boolean) => {
    setInternalRequired(checked)
    if (onRequiredChange) onRequiredChange(checked)
  }

  return (
    <div className="space-y-4">
      <DialogTitle>Field type: Signature</DialogTitle>
      <div>
        <Label className="block text-sm font-medium mb-2">Field Name</Label>
        <Input
          required
          type="text"
          value={internalFieldName}
          onChange={handleFieldNameChange}
        />
      </div>
      <div className="flex items-center gap-3 mt-2">
        <Checkbox checked={internalRequired} onCheckedChange={handleRequiredChange} />
        <Label>Is required</Label>
      </div>
    </div>
  )
}
