import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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

    return (
        <div className="space-y-2">
            <Label className="block text-sm font-medium">{label}</Label>
            <Textarea placeholder="Enter content" onChange={(v) => {setInternalValue(v.target.value), onChange(v.target.value)}} value={internalValue} />
        </div>
    )
}
