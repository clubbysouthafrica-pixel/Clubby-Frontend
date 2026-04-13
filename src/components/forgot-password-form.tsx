import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { AlertCircle } from "lucide-react";
import { AxiosError } from "axios";
import {
  forgotPassword as forgotMemberPassword,
  resetMemberTemporaryPassword,
} from "@/services/auth_service.tsx";
import {
  forgotPassword as forgotAdminPassword,
  resetAdminTemporaryPassword,
} from "@/services/admin/auth_service.tsx";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const username = searchParams.get("username");
  const isAdminFlow = searchParams.get("admin") === "true";

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(username || "");
  const [error, setError] = useState("");
  const [showReturnToLoginForNotFound, setShowReturnToLoginForNotFound] =
    useState(false);
  const [temporaryCredentialsMessage, setTemporaryCredentialsMessage] =
    useState("");
  const [temporaryCredentialsUsername, setTemporaryCredentialsUsername] =
    useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendAttempted, setResendAttempted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const verifyOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    setShowReturnToLoginForNotFound(false);
    setTemporaryCredentialsMessage("");
    setTemporaryCredentialsUsername("");
    setResendAttempted(false);
    setSuccessMessage("");

    try {
      const response = await (isAdminFlow
        ? forgotAdminPassword(email)
        : forgotMemberPassword(email));

      if (response.status === 200) {
        navigate(`/resetpassword?username=${email}`);
        return;
      }

      if (response.status === 404) {
        setError("No user exists for this username.");
        setShowReturnToLoginForNotFound(true);
        return;
      }

      if (response.status === 411) {
        setTemporaryCredentialsUsername(email);
        setTemporaryCredentialsMessage(
          response.data?.message ?? "something went wrong",
        );
        return;
      }

      setError("something went wrong");
    } catch (e) {
      if (!e) {
        setError("something went wrong");
      }

      if (e instanceof AxiosError) {
        setError(e.response?.data?.message ?? "something went wrong");
      } else {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendNewTemporaryCredentials = async () => {
    const usernameToReset = temporaryCredentialsUsername || email;

    if (!usernameToReset) return;

    setResendLoading(true);
    setResendAttempted(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = isAdminFlow
        ? await resetAdminTemporaryPassword(usernameToReset)
        : await resetMemberTemporaryPassword(usernameToReset);

      if (response.status === 200) {
        setSuccessMessage(
          response.data?.message || "Temporary credentials sent successfully!",
        );
        return;
      }

      setError(response.data?.message ?? "something went wrong");
    } catch (e) {
      if (!e) {
        setError("something went wrong");
      }

      if (e instanceof AxiosError) {
        setError(e.response?.data?.message ?? "something went wrong");
      } else {
        setError((e as Error).message);
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="gap-4">
        <CardHeader className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {isAdminFlow ? "Admin Account Recovery" : "Member Account Recovery"}
          </div>
          <CardTitle className="text-xl">
            {temporaryCredentialsMessage
              ? "Temporary Credentials Required"
              : "Forgot your password?"}
          </CardTitle>
          <CardDescription>
            {temporaryCredentialsMessage
              ? temporaryCredentialsMessage
              : "Reset your password by entering your email address. We'll send you a one-time pin to reset your password. If your Clubby user still has temporary credentials, you can reset them here."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (successMessage) {
                navigate("/login");
                return;
              }

              if (showReturnToLoginForNotFound) {
                navigate("/login");
                return;
              }

              if (temporaryCredentialsMessage) {
                sendNewTemporaryCredentials();
                return;
              }

              verifyOTP(e);
            }}
          >
            <div className="grid gap-6">
              {temporaryCredentialsMessage ? (
                <>
                  {successMessage && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        {successMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Email</Label>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setShowReturnToLoginForNotFound(false);
                    }}
                    required
                  />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {(!temporaryCredentialsMessage || !resendAttempted) && (
              <Button
                type={showReturnToLoginForNotFound ? "button" : "submit"}
                variant={showReturnToLoginForNotFound ? "outline" : undefined}
                className="w-full mt-6"
                disabled={loading || resendLoading}
                onClick={
                  showReturnToLoginForNotFound
                    ? () => navigate("/login")
                    : undefined
                }
              >
                {showReturnToLoginForNotFound
                  ? "Return to login"
                  : temporaryCredentialsMessage
                  ? resendLoading
                    ? "Sending..."
                    : "Send new temporary credentials"
                  : loading
                    ? "Submitting..."
                    : "Submit"}
              </Button>
            )}

            {temporaryCredentialsMessage && !resendLoading && (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-3"
                onClick={() => navigate("/login")}
              >
                Return to login
              </Button>
            )}
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
