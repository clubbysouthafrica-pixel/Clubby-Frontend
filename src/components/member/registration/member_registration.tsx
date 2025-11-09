import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useFetchMemberRegisteration } from "@/queries/registration-form";
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

export function MemberRegistration({
  clubAccountId,
  clubName,
  currency,
  membershipStatus
}: { clubAccountId: string, currency: string, clubName: string, membershipStatus: string }) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { data, isLoading } = useFetchMemberRegisteration(
    clubAccountId,
    currency
  );

  const getDeregReason = (d: unknown): string | undefined => {
    if (typeof d === "object" && d !== null && "deregistration_reason" in d) {
      const val = (d as { deregistration_reason?: unknown }).deregistration_reason;
      if (typeof val === "string" && val.trim()) return val;
    }
    return undefined;
  };
  const deregReason = getDeregReason(data);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center p-5 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (membershipStatus) {
      case "Registered":
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          title: "Registration Confirmed",
        };
      case "Pending":
        return {
          icon: <Clock className="h-4 w-4" />,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          title: "Registration Pending",
        };
      case "Resubmission required":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          title: "Resubmission Required",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          title: "Registration Status",
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="w-full space-y-2 flex-1 min-h-0 flex flex-col">
      {/* Status Alert Banner */}
      <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-lg p-3 space-y-2`}>
        {/* Title row with icon */}
        <div className="flex items-center gap-2">
          <div className={statusConfig.color}>{statusConfig.icon}</div>
          <h3 className={`text-xs font-semibold ${statusConfig.color}`}>
            {statusConfig.title}
          </h3>
        </div>
        
        {/* Description text full width */}
        <div className="text-xs text-gray-700 leading-relaxed">
          {membershipStatus === "Pending" ? (
            <>
              Your registration is currently <strong>pending</strong>. The club admin still needs to verify your submitted registration and confirm if your registration fee has been paid.
              {" "}
              If you haven't paid yet, please visit <strong>Payments & Billing</strong> to complete the outstanding payment using a supported method.
              {" "}
              If your payment has already been made, please be patient while the admin completes the verification process.
            </>
          ) : membershipStatus === "Resubmission required" ? (
            <>
              Your registration requires a <strong>resubmission</strong>. This may be due to reasons such as your membership expiring, the club starting a new season, or invalid information in your previous submission. Please resubmit your registration form.
            </>
          ) : (
            <>
              Your registration has been <strong>successfully accepted</strong>, and your payment has been confirmed by the admin. You are now officially a member of {clubName}.
            </>
          )}
        </div>
      </div>

      {/* Deregistration reason (when provided by the club) */}
      {deregReason && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertCircle className="h-4 w-4" />
            <h3 className="text-xs font-semibold">Why was I deregistered?</h3>
          </div>
          <div className="text-xs text-gray-700 whitespace-pre-wrap">
            {deregReason}
          </div>
        </div>
      )}

      {/* Registration Form Card */}
      <Card className="w-full border shadow-sm pt-0 flex-1 min-h-0 flex flex-col">
        <CardHeader className="border-b bg-muted/30 py-1 pb-1">
          <CardTitle className="text-l text-center pt-2">
            {clubName}
          </CardTitle>
          <CardDescription className="text-center text-xs">
            {membershipStatus === "Resubmission required" ? "Deregistered Registration Form" : "Submitted Registration Form" }
          </CardDescription>
        </CardHeader>
        <CardContent className="py-2 px-4 flex-1 min-h-0 flex flex-col">
          <div key={data.pages[currentPageIndex].page_index} className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-base font-semibold text-center border-b pb-2">
              {data.pages[currentPageIndex].page_header}
            </h3>
            
            <div className="flex-1 overflow-y-auto h-[300px] space-y-6 px-2 py-2">
              {data.pages[currentPageIndex].fields.map((field: { type: string; label: string; value: string; signature_type?: string; quantity?: number }) => {

                if (field.type === "STANDARD_SIGNATURE") {
                  if (field.signature_type === "signature") {
                    return (
                      <div key={field.label} className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
                        <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
                        <img
                          src={field.value}
                          alt="User Signature"
                          className="border-b-2 border-gray-400 max-w-xs"
                        />
                      </div>
                    )
                  } else {
                    return (
                      <div key={field.label} className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
                        <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
                        <Label className="text-sm font-[cursive] border-b-2 border-gray-400 pb-1">
                          {field.value}
                        </Label>
                      </div>
                    )
                  }
                }

                if (field.type === "STANDARD_OTHER") {
                  return (
                    <div key={field.label} className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
                      <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
                      <Label className="text-sm border-b-2 border-gray-300 pb-1">
                        {field.value}
                      </Label>
                    </div>
                  );
                }

                if (field.type === "BILLING") {
                  return (
                    <div key={field.label} className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg border">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        {field.label} {field.quantity ? `(x${field.quantity})` : null}
                      </Label>
                      <Label className="text-sm font-medium border-b-2 border-gray-300 pb-1">
                        {field.value}
                      </Label>
                    </div>
                  );
                }

                if (field.type === "TEXT") {
                  const cleaned = field.label
                    .replace(
                      /<ol>(\s*<li[^>]*data-list="bullet"[^>]*>[\s\S]*?)<\/ol>/g,
                      "<ul>$1</ul>"
                    )
                    .replace(/<span class="ql-ui"[^>]*><\/span>/g, "");

                  return (
                    <div
                      key={field.label}
                      className="prose prose-sm max-w-none text-gray-700 p-3 bg-muted/10 rounded-lg text-sm [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5"
                      dangerouslySetInnerHTML={{ __html: cleaned }}
                    />
                  );
                }


                if (field.type === "DNE") {
                  return (
                    <div key={field.label} className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-lg border border-dashed">
                      <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
                      <Label className="text-xs italic text-gray-500">
                        Not filled in by member.
                      </Label>
                    </div>
                  );
                }

              })}
            </div>

            {/* Pagination Controls */}
            {data.pages.length > 1 && (
              <div className="flex justify-between items-center pt-3 border-t">
                {currentPageIndex > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-[90px]"
                    onClick={() => setCurrentPageIndex((i) => i - 1)}
                  >
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                <div className="text-xs text-muted-foreground">
                  Page {currentPageIndex + 1} of {data.pages.length}
                </div>

                {currentPageIndex < data.pages.length - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-[90px]"
                    onClick={() => setCurrentPageIndex((i) => i + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
