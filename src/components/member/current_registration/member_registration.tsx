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
import { Loader2, AlertCircle } from "lucide-react";
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

  return (
    <div className="w-full space-y-2 flex-1 min-h-0 flex flex-col mt-6">
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
      <Card className="w-full border shadow-sm pt-0 flex-1 min-h-0 flex flex-col gap-1" id="registration-card-header">
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
            
            <div className="flex-none space-y-6 px-2 py-2">
              {data.pages[currentPageIndex].fields.map((field: { type: string; label: string; value: string; signature_type?: string; quantity?: number; discount?: number }) => {

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
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          {field.label} {field.quantity ? `(x${field.quantity})` : null}
                        </Label>
                        {field.discount && (
                          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                            {field.discount}% off
                          </span>
                        )}
                      </div>
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
                    onClick={() => {
                      setCurrentPageIndex((i) => i - 1);
                      document.getElementById('registration-card-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
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
                    onClick={() => {
                      setCurrentPageIndex((i) => i + 1);
                      document.getElementById('registration-card-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
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
