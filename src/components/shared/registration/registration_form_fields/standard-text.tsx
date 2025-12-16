import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { countryCodes, validatePhoneNumber } from "@/data/country-codes"

interface Field {
  field_id: string
  field_name: string
  field_type: string
  input_type: string
  placeholder?: string
  required?: boolean
  value?: string
  phone_number_input?: boolean
}

interface StandardFieldInputProps {
  field: Field
  currentPageIndex: number
  pages: any[]
  setFieldValue: (
    pageIndex: number,
    fieldId: string,
    updater: (f: any) => any
  ) => void
}

export default function StandardText({
  field,
  currentPageIndex,
  pages,
  setFieldValue,
}: StandardFieldInputProps) {
  const isNumber = field.input_type?.toLowerCase() === "number"
  const isPhoneNumber = field.phone_number_input === true
  const [countryCode, setCountryCode] = useState("ZA")
  const [phoneError, setPhoneError] = useState("")

  const onChange = (val: string) => {
    if (isPhoneNumber) {
      setPhoneNumber(val)
      setPhoneError("")
    } else if (!isNumber || val === "" || /^[0-9]*$/.test(val)) {
      setFieldValue(
        pages[currentPageIndex].page_index,
        field.field_id,
        (f) => ({
          ...f,
          value: val,
        })
      )
    }
  }

  const [phoneNumber, setPhoneNumber] = useState(field.value ?? "")

  const validateAndFormatPhoneNumber = (): string => {
    if (!phoneNumber.trim()) {
      setPhoneError("Phone number is required")
      return ""
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError("Phone number must be between 7 and 15 digits")
      return ""
    }
    
    const dialingCode = countryCodes.find(c => c.code === countryCode)?.dialingCode || ""
    let digitsOnly = phoneNumber.replace(/\D/g, "")
    
    if (digitsOnly.startsWith("0")) {
      digitsOnly = digitsOnly.substring(1)
    }
    
    const fullPhoneNumber = dialingCode + digitsOnly
    
    setPhoneError("")
    return fullPhoneNumber
  }

  const handlePhoneBlur = () => {
    if (isPhoneNumber && phoneNumber.trim()) {
      const formattedNumber = validateAndFormatPhoneNumber()
      if (formattedNumber) {
        setFieldValue(
          pages[currentPageIndex].page_index,
          field.field_id,
          (f) => ({
            ...f,
            value: formattedNumber,
          })
        )
      }
    }
  }

  if (isPhoneNumber) {
    return (
      <div className="grid gap-2" key={field.field_id}>
        <Label htmlFor={field.field_id}>
          {field.field_name}{" "}
          {field.required ? <span className="text-red-500">*</span> : null}
        </Label>
        <div className="flex gap-3">
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger className="w-[80px]">
              <SelectValue>
                {countryCodes.find(c => c.code === countryCode)?.dialingCode}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {countryCodes.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.dialingCode} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id={field.field_id}
            type="tel"
            placeholder={field.placeholder || "Enter phone number"}
            value={phoneNumber}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handlePhoneBlur}
            required={field.required}
            className={phoneError ? "border-red-500" : ""}
          />
        </div>
        {phoneError && (
          <p className="text-sm text-red-500">{phoneError}</p>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-2" key={field.field_id}>
      <Label htmlFor={field.field_id}>
        {field.field_name}{" "}
        {field.required ? <span className="text-red-500">*</span> : null}
      </Label>
      <Input
        id={field.field_id}
        type={isNumber ? "number" : "text"}
        placeholder={field.placeholder}
        value={field.value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      />
    </div>
  )
}
