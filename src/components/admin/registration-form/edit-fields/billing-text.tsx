import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
    label: string
    value: string
    required?: boolean
    type?: string
    placeholder?: string
    onChange: (val: string) => void
}

export default function TextDisplay({
    label,
    value,
    required = true,
    type = "text",
    placeholder,
    onChange,
}: Props) {
    const [internalValue, setInternalValue] = useState(value)

    useEffect(() => {
        setInternalValue(value)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInternalValue(e.target.value)
        onChange(e.target.value)
    }

    return (
        // <div className="space-y-2">
        //     <Label className="block text-sm font-medium">Field Name</Label>
        //     <Input
        //         required={required}
        //         type={type}
        //         placeholder={placeholder}
        //         value={internalValue}
        //         onChange={handleChange}
        //     />
        </div>
    )
}
