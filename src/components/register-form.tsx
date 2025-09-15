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
import {Link, useNavigate} from "react-router-dom";
import {FormEvent, useContext, useState} from "react";
import {AuthContext, AuthContextType} from "@/context/AuthContext.tsx";
import {Alert, AlertDescription} from "@/components/ui/alert.tsx";
import {AlertCircle} from "lucide-react";
import {AxiosError} from "axios";

export function RegisterForm({
                              className,
                              ...props
                          }: React.ComponentProps<"div">) {
    const { register } = useContext(AuthContext) as AuthContextType || {};

    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [ error, setError] = useState("")
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")

    const registerUser = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!email || !password) return
        setLoading(true)

        try {
            await register(email, password)
            navigate(`/otp?username=${email}`)
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

    console.log('here')

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Member registration</CardTitle>
                    <CardDescription>
                        Get started with {import.meta.env.VITE_BRAND_NAME} by registering your own club member account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={registerUser}>
                            <div className="grid gap-6">
                                <div className="grid gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="email">Email</Label>
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
                                            <Label htmlFor="password">Password</Label>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="****"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            required />
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
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        { loading ? "Registering..." : "Register"}
                                    </Button>
                                </div>
                                <div className="text-center text-sm">
                                    Already have an account?{" "}
                                    <Link to="/login" className="underline underline-offset-4">
                                        Sign in
                                    </Link>
                                </div>
                            </div>
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
