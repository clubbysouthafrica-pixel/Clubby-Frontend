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
import { FormEvent, useState, useEffect } from "react";
import { useOnboardProfileMutation } from "@/mutations/profile"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useGetProfileQuery } from "@/queries/profile";

export function OnboardMemberForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const navigate = useNavigate()
    const { mutate, isPending } = useOnboardProfileMutation()
    const [firstName, setFirstName] = useState("")
    const [surname, setSurname] = useState("")
    const [dob, setDob] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")

    const { data } = useGetProfileQuery(false)

    useEffect(() => {
        setFirstName(data?.first_name ?? "")
        setSurname(data?.surname ?? "")
    }, [data]);

    const registerUser = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        mutate({
            first_name: firstName,
            surname: surname,
            date_of_birth: dob,
            phone_number: phoneNumber,
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
                                    <Input
                                        required
                                        type="text"
                                        placeholder="Enter your phone number +27"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending ? <><Loader2 className="h-8 w-8 animate-spin" /> Saving</> : "Save"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
