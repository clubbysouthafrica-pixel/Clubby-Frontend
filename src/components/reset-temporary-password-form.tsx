import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { AxiosError } from "axios";
import { resetTemporaryPassword } from "@/services/auth_service.tsx";
import { toast } from "sonner";

export function ResetTemporaryPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  if (!email) {
    return null;
  }

  const sendNewTemporaryPassword = async () => {
    setResendLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await resetTemporaryPassword(email);
      const message =
        response.message ||
        response.data?.message ||
        "Temporary credentials sent successfully!";
      setSuccessMessage(message);
      toast.success(message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        const errorMessage =
          e.response?.data?.message || "Failed to send temporary credentials";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        const errorMessage = (e as Error).message;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-left mb-3">
            Reset Temporary Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendNewTemporaryPassword();
            }}
          >
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 font-semibold text-base">
                    Reset Your Temporary Password
                  </p>
                  <p className="text-blue-700 text-sm mt-2">
                    Your temporary credentials have expired.
                  </p>
                  <p className="text-blue-700 text-sm mt-2">
                    We will send new temporary credentials to
                    <span className="font-semibold">{email}</span>.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      {successMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={resendLoading || !!successMessage}
                >
                  {resendLoading ? "Sending..." : "Send Temporary Credentials"}
                </Button>
              </div>

              <div className="text-center text-sm">
                <p>
                  <Link
                    to="/login"
                    className="underline underline-offset-4 cursor-pointer hover:no-underline"
                  >
                    Back to Login
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
