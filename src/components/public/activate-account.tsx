import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FormEvent, useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext, AuthContextType } from "@/context/AuthContext.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { AlertCircle } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { activateMemberUser } from "@/services/auth_service.tsx";
import { activateAdminUser } from "@/services/admin/auth_service.tsx";
import { toast } from "sonner";
import { AxiosError } from "axios";

export function ActivateAccountForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const navigate = useNavigate()
    const { login } = (useContext(AuthContext) as AuthContextType) || {};

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [password, setPassword] = useState<string>("")
    const [secondPassword, setSecondPassword] = useState<string>("")
    const [showPassword, setShowPassword] = useState(false);

    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');

    const activateAccount = async (event: FormEvent) => {
        event.preventDefault();

        if (password.length < 8) {
            setError("Password length is too short.")
            return
        }

        if (password !== secondPassword) {
            setError("Both passwords must match.")
            return
        }
        const session = sessionStorage.getItem("cognitoSession");
        try {
            setLoading(true)
            const isAdmin = localStorage.getItem("isAdminActivation") === "true";
            if (isAdmin) {
                await activateAdminUser(email as string, session as string, password as string)
            } else {
                await activateMemberUser(email as string, session as string, password as string)
            }

            toast.success("Successfully activated account.")
            
            // Auto sign in the user
            try {
                const {
                    onboarded,
                }: { onboarded: boolean; new_password_required: boolean } = await login(
                    isAdmin,
                    email as string,
                    password as string,
                );

                if (isAdmin) {
                    localStorage.setItem("isAdmin", "true");
                    navigate("/");
                } else {
                    navigate(onboarded ? "/" : "/onboardMember");
                }
            } catch (loginError) {
                // If login fails, redirect to login page
                navigate("/login");
            }

        } catch (e) {
            if (!e) {
                setError("Something went wrong")
            }

            if (e instanceof AxiosError) {
                setError(e.response?.data?.message)
            } else {
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
                    <CardTitle className="text-xl">Activate Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={activateAccount}>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">User: <strong>{email}</strong></Label>
                                </div>
                            </div>
                            <div className="grid gap-3 relative">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">New Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="**********"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        setError("");
                                    }}
                                    required
                                />
                                <div
                                    className="absolute right-5 bottom-10 top-[55%] transform -translate-y-1/2 cursor-pointer text-muted-foreground"
                                    onClick={() => { setShowPassword(!showPassword), setError("") }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                            </div>
                            <div className="grid gap-3 relative">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="secondpassword">Re-enter password</Label>
                                </div>
                                <Input
                                    id="secondpassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="**********"
                                    value={secondPassword}
                                    onChange={(event) => {
                                        setSecondPassword(event.target.value);
                                        setError("");
                                    }}
                                    required
                                />
                                <div
                                    className="absolute right-5 bottom-10 top-[55%] transform -translate-y-1/2 cursor-pointer text-muted-foreground"
                                    onClick={() => { setShowPassword(!showPassword), setError("") }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
