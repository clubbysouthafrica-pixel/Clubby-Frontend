import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogTitle } from "@/components/ui/dialog"

interface Props {
  required?: boolean
  onRequiredChange?: (val: boolean) => void
}

export default function EditStandardSignature({
  required = false,
  onRequiredChange,
}: Props) {
  const [internalRequired, setInternalRequired] = useState(required)

  useEffect(() => setInternalRequired(required), [required])

  const handleRequiredChange = (checked: boolean) => {
    setInternalRequired(checked)
    if (onRequiredChange) onRequiredChange(checked)
  }

  return (
    <div className="space-y-4">
      <DialogTitle>Signature</DialogTitle>
      <div className="flex items-center gap-3 mt-2">
        <Checkbox checked={internalRequired} onCheckedChange={handleRequiredChange} />
        <Label>Is required</Label>
      </div>
    </div>
  )
}
