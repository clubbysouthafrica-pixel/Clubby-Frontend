import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {FormEvent, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {Input} from "@/components/ui/input.tsx";
import {Alert, AlertDescription} from "@/components/ui/alert.tsx";
import {AlertCircle} from "lucide-react";
import {AxiosError} from "axios";
import {resetPassword} from "@/services/auth_service.tsx";

export function ResetPasswordForm({
                            className,
                            ...props
                        }: React.ComponentProps<"div">) {
    const navigate = useNavigate()

    const [searchParams] = useSearchParams();
    const username = searchParams.get('username');

    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState(username || "")
    const [error, setError] = useState("")
    const [code, setCode] = useState<string>("")
    const [password, setPassword] = useState<string>("")

    const verifyOTP = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!email || !code || !password) return
        setLoading(true)

        try {
            await resetPassword(username ?? email, code, password)
            navigate(`/login?username=${email}`)
        } catch (e) {
            if (!e) {
                setError("something went wrong")
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
                    <CardTitle className="text-xl">Reset Password</CardTitle>
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
                                    <Label htmlFor="password">Confirmation Code</Label>
                                </div>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="Confirmation code"
                                    value={code}
                                    onChange={(event) => setCode(event.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">New Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="***"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                />
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
                            {loading ? "Submitting...": "Submit"}
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
