import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { countryCodes, validatePhoneNumber } from "@/data/country-codes"
import RequiredLabel from "./required-label"

interface Field {
  field_id: string
  field_name: string
  field_type: string
  input_type: string
  placeholder?: string
  required?: boolean
  value?: string | number
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
  
  // Parse prefilled phone number if it exists
  const parsePhoneNumber = () => {
    if (!isPhoneNumber || typeof field.value !== "string" || !field.value) {
      return { country: "ZA", number: typeof field.value === "string" ? field.value : "" }
    }
    
    // Sort by longest dialing code first to avoid conflicts (e.g., +2 vs +27)
    const sortedCodes = [...countryCodes].sort((a, b) => b.dialingCode.length - a.dialingCode.length)
    
    for (const country of sortedCodes) {
      if (field.value.startsWith(country.dialingCode)) {
        const numberOnly = field.value.substring(country.dialingCode.length)
        return { country: country.code, number: numberOnly }
      }
    }
    
    // If no match found, default to ZA and return the whole value
    return { country: "ZA", number: field.value }
  }
  
  const parsed = parsePhoneNumber()
  const [countryCode, setCountryCode] = useState(parsed.country)
  const [phoneNumber, setPhoneNumber] = useState(parsed.number)
  const [phoneError, setPhoneError] = useState("")

  const onChange = (val: string) => {
    if (isPhoneNumber) {
      setPhoneNumber(val)
      setPhoneError("")
      // Update the field value immediately so autofill and manual input both work
      setFieldValue(
        pages[currentPageIndex].page_index,
        field.field_id,
        (f) => ({
          ...f,
          value: val, // Store the raw value temporarily
        })
      )
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
            value: formattedNumber, // Store the formatted phone number with country code
          })
        )
      }
    } else if (isPhoneNumber && !phoneNumber.trim()) {
      // Clear the field if it's empty
      setFieldValue(
        pages[currentPageIndex].page_index,
        field.field_id,
        (f) => ({
          ...f,
          value: "",
        })
      )
    }
  }

  if (isPhoneNumber) {
    return (
      <div className="space-y-2" key={field.field_id}>
        <RequiredLabel htmlFor={field.field_id} required={field.required} className="block text-base font-medium text-gray-900">
          {field.field_name}{" "}
        </RequiredLabel>
        <div className="flex gap-2">
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger className="w-[100px] border border-gray-300 rounded-md px-3 py-2.5 text-base font-normal">
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
            onInvalid={(e) => e.preventDefault()}
            className={`flex-1 border border-gray-300 rounded-md px-3 py-2.5 text-base font-normal focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
              phoneError ? "border-red-500 focus:ring-red-500" : ""
            }`}
          />
        </div>
        {phoneError && (
          <p className="text-sm text-red-600">{phoneError}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2" key={field.field_id}>
      <RequiredLabel htmlFor={field.field_id} required={field.required} className="block text-base font-medium text-gray-900">
        {field.field_name}
      </RequiredLabel>
      <Input
        id={field.field_id}
        type={isNumber ? "number" : "text"}
        placeholder={field.placeholder}
        value={field.value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        onInvalid={(e) => e.preventDefault()}
        className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-base font-normal focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
      />
    </div>
  )
}
