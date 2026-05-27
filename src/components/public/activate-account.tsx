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
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { Input } from "@/components/ui/input.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { AlertCircle } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { activateMemberUser } from "@/services/auth_service.tsx";
import { activateAdminUser } from "@/services/admin/auth_service.tsx";
import { toast } from "sonner";
import { AxiosError } from "axios";

const PASSWORD_REQUIREMENTS = [
    {
        label: "At least 8 characters",
        test: (value: string) => value.length >= 8,
    },
    {
        label: "One uppercase letter",
        test: (value: string) => /[A-Z]/.test(value),
    },
    {
        label: "One lowercase letter",
        test: (value: string) => /[a-z]/.test(value),
    },
    {
        label: "One number",
        test: (value: string) => /\d/.test(value),
    },
    {
        label: "One special character",
        test: (value: string) => /[^A-Za-z0-9]/.test(value),
    },
];

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
    const passwordChecks = PASSWORD_REQUIREMENTS.map((requirement) => ({
        ...requirement,
        met: requirement.test(password),
    }));
    const isPasswordValid = passwordChecks.every((requirement) => requirement.met);

    const activateAccount = async (event: FormEvent) => {
        event.preventDefault();

        if (!isPasswordValid) {
            const unmetRequirements = passwordChecks
                .filter((requirement) => !requirement.met)
                .map((requirement) => requirement.label.toLowerCase());

            setError(`Password must include ${unmetRequirements.join(", ")}.`)
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
            } catch {
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
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="space-y-3 text-center">
                    <div className="space-y-1">
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                            Set Your Password
                        </p>
                        <CardTitle className="text-2xl text-slate-950">Activate Account</CardTitle>
                        <p className="text-sm leading-6 text-slate-600">
                            Your account is ready. Choose a secure password to finish setting it up and sign in.
                        </p>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={activateAccount}>
                        <div className="grid gap-6">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                                    Account Email
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-950">{email}</p>
                            </div>

                            <div className="grid gap-3 relative">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Create Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your new password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        setError("");
                                    }}
                                    required
                                />
                                <div
                                    className="absolute right-5 bottom-10 top-[55%] transform -translate-y-1/2 cursor-pointer text-muted-foreground"
                                    onClick={() => {
                                        setShowPassword(!showPassword);
                                        setError("");
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    <p className="font-medium text-slate-700">Password requirements</p>
                                    <ul className="mt-2 space-y-1">
                                        {passwordChecks.map((requirement) => (
                                            <li
                                                key={requirement.label}
                                                className={requirement.met ? "text-emerald-700" : "text-slate-600"}
                                            >
                                                {requirement.met ? "✓" : "•"} {requirement.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="grid gap-3 relative">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="secondpassword">Confirm Password</Label>
                                </div>
                                <Input
                                    id="secondpassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Re-enter your password"
                                    value={secondPassword}
                                    onChange={(event) => {
                                        setSecondPassword(event.target.value);
                                        setError("");
                                    }}
                                    required
                                />
                                <div
                                    className="absolute right-5 bottom-10 top-[55%] transform -translate-y-1/2 cursor-pointer text-muted-foreground"
                                    onClick={() => {
                                        setShowPassword(!showPassword);
                                        setError("");
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                            </div>


                            {
                                error &&
                                <Alert variant="destructive" className="border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            }
                        </div>

                        <Button type="submit" className="w-full mt-6" disabled={loading}>
                            {loading ? "Setting password..." : "Set password and continue"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            <div className="text-center text-xs leading-5 text-slate-500">
                Once your password is set, you will be signed in automatically.
            </div>
        </div>
    )
}
