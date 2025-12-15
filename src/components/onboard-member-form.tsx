import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FormEvent, useState, useEffect } from "react";
import { useOnboardProfileMutation } from "@/mutations/profile"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useGetProfileQuery } from "@/queries/profile";
import { countryCodes, validatePhoneNumber } from "@/data/country-codes";

export function OnboardMemberForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const navigate = useNavigate()
    const { mutate, isPending } = useOnboardProfileMutation()
    const [firstName, setFirstName] = useState("")
    const [surname, setSurname] = useState("")
    const [dob, setDob] = useState("")
    const [countryCode, setCountryCode] = useState("ZA")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [phoneError, setPhoneError] = useState("")

    const { data, isLoading } = useGetProfileQuery(false)

    useEffect(() => {
        setFirstName(data?.first_name ?? "")
        setSurname(data?.surname ?? "")
    }, [data]);

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
        const digitsOnly = phoneNumber.replace(/\D/g, "")
        const fullPhoneNumber = dialingCode + digitsOnly
        
        setPhoneError("")
        return fullPhoneNumber
    }

    const registerUser = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const fullPhoneNumber = validateAndFormatPhoneNumber()
        if (!fullPhoneNumber) {
            return
        }

        mutate({
            first_name: firstName,
            surname: surname,
            date_of_birth: dob,
            phone_number: fullPhoneNumber,
        }, {
            onSuccess: () => navigate("/"),
            onError: (error: any) => {
                toast.error(error.response?.data?.message || "An unexpected error occurred.")
            }
        })
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Onboarding form</CardTitle>
                    <CardDescription>
                        This will ensure your account is ready to register with clubs. Please complete the onboarding form
                    </CardDescription>
                </CardHeader>
                {
                    isLoading ?
                        <CardContent className="flex justify-center items-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </CardContent>
                        :
                        <CardContent>
                            <form onSubmit={registerUser}>
                                <div className="grid-2 gap-6">
                                    <div className="grid gap-6">
                                        <div className="grid gap-3">
                                            <Label>First Name</Label>
                                            <Input
                                                required
                                                type="text"
                                                placeholder="Enter your first name"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label>Last Name</Label>
                                            <Input
                                                required
                                                type="text"
                                                placeholder="Enter your last name"
                                                value={surname}
                                                onChange={(e) => setSurname(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label>Date of Birth</Label>
                                            <Input
                                                required
                                                type="date"
                                                placeholder="Set date of birth"
                                                value={dob?.replaceAll("/", "-")}
                                                onChange={(e) => setDob(e.target.value?.replaceAll("-", "/"))}
                                            />
                                        </div>

                                        <div className="grid gap-3">
                                            <Label>Phone Number</Label>
                                            <div className="flex gap-3">
                                                <Select value={countryCode} onValueChange={setCountryCode}>
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {countryCodes.map((country) => (
                                                            <SelectItem key={country.code} value={country.code}>
                                                                {country.name} {country.dialingCode}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    required
                                                    type="tel"
                                                    placeholder="Enter phone number"
                                                    value={phoneNumber}
                                                    onChange={(e) => {
                                                        setPhoneNumber(e.target.value)
                                                        setPhoneError("")
                                                    }}
                                                    className={phoneError ? "border-red-500" : ""}
                                                />
                                            </div>
                                            {phoneError && (
                                                <p className="text-sm text-red-500">{phoneError}</p>
                                            )}
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isPending}>
                                            {isPending ? <><Loader2 className="h-8 w-8 animate-spin" /> Saving</> : "Save"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                }
            </Card>
        </div>
    )
}
