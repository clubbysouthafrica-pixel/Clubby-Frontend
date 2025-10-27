import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"

interface Props {
  label: string
  value: string
  onChange: (val: string) => void
}

export default function EditTextDisplay({
  label,
  value,
  onChange,
}: Props) {
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleChange = (val: string) => {
    setInternalValue(val)  
    onChange(val)
  }

  return (
    <div className="space-y-2">
      <Label className="block text-sm font-medium">{label}</Label>
      <ReactQuill
        theme="snow"
        value={internalValue}
        onChange={handleChange}
        placeholder="Enter content"
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "clean"],
          ],
        }}
      />
    </div>
  )
}
