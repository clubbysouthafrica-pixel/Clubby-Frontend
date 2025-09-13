import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FormEvent, useContext, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp.tsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input.tsx";
import { AuthContext, AuthContextType } from "@/context/AuthContext.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { AlertCircle } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

export function OTPForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { verifyConfirmationCode } = useContext(AuthContext) as AuthContextType || {};
    const navigate = useNavigate()

    const [searchParams] = useSearchParams();
    const username = searchParams.get('username');

    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState(username || "")
    const [error, setError] = useState("")
    const [otp, setOtp] = useState<string>("")

    const verifyOTP = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!email || !otp) return
        setLoading(true)

        try {
            await verifyConfirmationCode(username ?? email, otp)
            navigate("/login")
            toast.success(
                "Your account has been created successfully. Please go back to the member login page to sign in to your account.",
                {
                    autoClose: 20000,
                    style: {
                        background: "#000000",
                        color: "#fff",
                    },
                }
            )
        } catch (e) {
            if (!e) {
                setError("Something went wrong. If the issue persists please try re-registering.")
            }

            if (e instanceof AxiosError) {
                // handle axios specific error
                setError(e.response?.data?.message)
            } else {
                // handle other errors
                setError((e as Error).message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome to {import.meta.env.VITE_BRAND_NAME}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={verifyOTP}>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Username</Label>
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Enter OTP</Label>
                                </div>
                                <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                                <div className="text-xs">
                                    Please enter the one-time pin sent to your email.
                                </div>
                            </div>

                            {
                                error &&
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            }
                        </div>

                        <Button type="submit" className="w-full mt-6" disabled={loading}>
                            {loading ? "Submitting..." : "Submit"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </div>
        </div>
    )
}
