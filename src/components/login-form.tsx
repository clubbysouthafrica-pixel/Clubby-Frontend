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
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext, AuthContextType } from "@/context/AuthContext.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { AxiosError } from "axios";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const location = useLocation();

  const isAdminLogin = location.pathname === '/admin/login';

  const { login } = useContext(AuthContext) as AuthContextType || {};
  const navigate = useNavigate()

  const [searchParams] = useSearchParams();
  const username = searchParams.get('username');
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState<string>(username || "");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const signIn = async () => {
    if (!email || !password) return
    setLoading(true)

    try {
      const { onboarded, new_password_required }: { onboarded: boolean, new_password_required: boolean } = await login(isAdminLogin, email, password)

      if (new_password_required) {
        navigate(`/activateAccount?email=${encodeURIComponent(email)}`)
      } else {
        if (isAdminLogin) {
          localStorage.setItem("isAdmin", "true")
          navigate("/")
          return
        }

        navigate(onboarded ? "/" : "/onboardMember")
      }
    } catch (e: unknown) {
      if (!e) {
        setError("something went wrong")
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
          <CardTitle className="text-xl">{isAdminLogin ? "Admin Login" : "Member Login"}</CardTitle>
          <CardDescription>
            Login to your {isAdminLogin ? "admin" : "club"} account {isAdminLogin ? " to manage your clubs" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            signIn()
          }}>
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
                    <Link
                      to="/forgotpassword"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="***"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required />
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="text-center text-sm">
                {
                  isAdminLogin ?
                    <p>
                      Want to register a club?{" "}
                      <Link to="/contactus" className="underline underline-offset-4">
                        Contact us
                      </Link>
                    </p>
                    :
                    <p>
                      Don&apos;t have an account?{" "}
                      <Link to="/register" className="underline underline-offset-4">
                        Register
                      </Link>
                    </p>
                }
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      {
        !isAdminLogin &&
        <div className="text-muted-foreground text-center text-xs">
          Go to admin login page <Link to="/admin/login" className="underline">here</Link>
        </div>
      }
      {
        isAdminLogin &&
        <div className="text-muted-foreground text-center text-xs">
          Go to member login page <Link to="/login" className="underline">here</Link>
        </div>
      }
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
