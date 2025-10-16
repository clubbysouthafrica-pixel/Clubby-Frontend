import { Label } from "@/components/ui/label"
import { useEffect } from "react"

interface Field {
  field_name: string
  required: boolean
}

interface StandardFieldInputProps {
  field: Field
}

export default function StandardSignature({
  field
}: StandardFieldInputProps) {
  
    useEffect(() => {
      
    })

  return (
    <div className="w-full" key="dkld">
      <Label htmlFor="kdlkdj">
        {field.field_name}{" "}
      </Label>
      <p className="text-xs mt-1">Is Required: {field.required ? "true" : "false"} </p>
    </div>
  )
}
