import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import {
  getPortalRedirectTarget,
  getSafeRedirectTarget,
  isRedirectTargetValidForPortal,
} from "@/services/auth-session";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login } = (useContext(AuthContext) as AuthContextType) || {};
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const username = searchParams.get("username");
  const queryEmail = searchParams.get("email");
  const queryTempPassword = searchParams.get("tempPassword");
  const loginType = searchParams.get("login");
  const redirectTarget = getSafeRedirectTarget(searchParams.get("redirect"));
  
  const [isAdminLogin, setAdminLogin] = useState(loginType === "admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorStatusCode, setErrorStatusCode] = useState<number | null>(null);
  const [email, setEmail] = useState<string>(queryEmail || username || "");
  const [password, setPassword] = useState<string>(queryTempPassword || "");
  const [showPassword, setShowPassword] = useState(false);
  const autoSubmitRef = useRef(false);

  useEffect(() => {
    const portal = isAdminLogin ? "admin" : "member";

    if (!searchParams.has("redirect") || isRedirectTargetValidForPortal(redirectTarget, portal)) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("redirect");

    const nextQuery = nextSearchParams.toString();
    navigate(nextQuery ? `/login?${nextQuery}` : "/login", { replace: true });
  }, [isAdminLogin, navigate, redirectTarget, searchParams]);

  const signIn = async (emailParam?: string, passwordParam?: string) => {
    const emailToUse = emailParam || email;
    const passwordToUse = passwordParam || password;
    
    if (!emailToUse || !passwordToUse) return;
    setLoading(true);

    try {
      const {
        onboarded,
        new_password_required,
      }: { onboarded: boolean; new_password_required: boolean } = await login(
        isAdminLogin,
        emailToUse,
        passwordToUse,
      );

      if (new_password_required) {
        if (isAdminLogin) localStorage.setItem("isAdminActivation", "true");
        else localStorage.setItem("isAdminActivation", "false");
        navigate(`/activateAccount?email=${encodeURIComponent(emailToUse)}`);
      } else {
        if (isAdminLogin) {
          localStorage.setItem("isAdmin", "true");
          navigate(getPortalRedirectTarget(redirectTarget, "admin"), { replace: true });
          return;
        }

        navigate(
          onboarded ? getPortalRedirectTarget(redirectTarget, "member") : "/onboardMember",
          { replace: true },
        );
      }
    } catch (e: unknown) {
      if (!e) {
        setError("something went wrong");
      }

      if (e instanceof AxiosError) {
        if (e.response?.data?.message === "User is not confirmed.")
          navigate(`/otp?username=${encodeURIComponent(emailToUse)}`);
        
        if (e.response?.status === 411) {
          navigate(`/login/reset-email?email=${encodeURIComponent(emailToUse)}&admin=${isAdminLogin}`);
          return;
        }
        
        setErrorStatusCode(e.response?.status || null);
        setError(e.response?.data?.message);
      } else {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit login if email and tempPassword query parameters are provided
  useEffect(() => {
    if (queryEmail && queryTempPassword && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      // Call signIn directly with query parameters
      signIn(queryEmail, queryTempPassword);
    }
  }, [queryEmail, queryTempPassword]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-left mb-3">
            Log in to your account
          </CardTitle>
          {errorStatusCode !== 411 && (
            <CardDescription className="bg-gray-100 p-1 rounded-sm flex">
              <Button
                variant={isAdminLogin ? "ghost" : "default"}
                className={
                  "rounded-sm w-1/2 " +
                  (isAdminLogin ? "" : " bg-indigo-400 hover:bg-indigo-400")
                }
                onClick={() => setAdminLogin(false)}
              >
                Member
              </Button>
              <Button
                variant={isAdminLogin ? "default" : "ghost"}
                className={
                  "rounded-sm w-1/2 " +
                  (isAdminLogin ? " bg-indigo-400 hover:bg-indigo-400" : "")
                }
                onClick={() => setAdminLogin(true)}
              >
                Admin
              </Button>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn();
            }}
          >
            <div className="grid gap-6">
              <div className="grid gap-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <p className="mt-4 text-sm text-gray-600">Signing in...</p>
                  </div>
                ) : errorStatusCode === 411 ? (
                  <>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 font-semibold text-base">
                        Your temporary password has expired
                      </p>
                      <p className="text-red-700 text-sm mt-2">
                        Please reset your temporary password to continue.
                      </p>
                    </div>
                    <Link to={`/login/reset-email?email=${encodeURIComponent(email)}&admin=${isAdminLogin}`}>
                      <Button type="button" className="w-full">
                        Reset Temporary Password
                      </Button>
                    </Link>
                  </>
                ) : (
                      <>
                        <div className="grid gap-3 pt-3">
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
                        <div className="grid gap-3 pb-3">
                          <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <Link
                              to={
                                isAdminLogin
                                  ? "/forgotpassword?admin=true"
                                  : "/forgotpassword"
                              }
                              className="ml-auto text-xs underline-offset-4 hover:underline"
                            >
                              Forgot your password?
                            </Link>
                          </div>

                          {/* Relative wrapper for input + icon */}
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="***"
                              value={password}
                              onChange={(event) => setPassword(event.target.value)}
                              required
                              className="pr-10" // Add padding to the right so the icon doesn't overlap text
                            />

                            {/* Eye icon */}
                            <div
                              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground"
                              onClick={() => {
                                setShowPassword(!showPassword);
                                setError("");
                              }}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                          </div>
                        </div>

                        {error && errorStatusCode !== 411 && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Logging in..." : "Login"}
                        </Button>
                      </>
                    )}
              </div>
              <div className="text-center text-sm">
                {isAdminLogin ? (
                  <p>
                    Want to register a club?{" "}
                    <Link
                      to="/contactus"
                      className="underline underline-offset-4"
                    >
                      Contact us
                    </Link>
                  </p>
                ) : (
                  <p>
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/register"
                      className="underline underline-offset-4"
                    >
                      Register
                    </Link>
                  </p>
                )}
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
  );
}
