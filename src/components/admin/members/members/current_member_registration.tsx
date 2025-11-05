import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useFetchMemberRegisteration } from "@/queries/admin/registration-form";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

function formatEpoch(epoch: number) {
  const date = new Date(epoch);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

export function CurrentMemberRegistration({
  userId,
  clubAccountId,
  currency,
  clubName,
}: { userId: string, clubAccountId: string, currency: string, clubName: string }) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { data, isLoading } = useFetchMemberRegisteration(
    clubAccountId,
    userId,
    currency
  );

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center p-5 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="w-full space-y-6">
      {/* Registration Timeline Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm bg-muted/30 p-4 rounded-lg border">
        {data?.registration_submitted_on && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Submitted:</span>
            <strong>{formatEpoch(data.registration_submitted_on)}</strong>
          </div>
        )}

        {data?.registration_submitted_on && data?.registered_on && (
          <span className="text-gray-300">|</span>
        )}

        {data?.registered_on && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Registered:</span>
            <strong className="text-green-600">{formatEpoch(data.registered_on)}</strong>
          </div>
        )}

        {(data?.registered_on && data?.deregistered_on) || (data?.registration_submitted_on && data?.deregistered_on) ? (
          <span className="text-gray-300">|</span>
        ) : null}

        {data?.deregistered_on && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Deregistered:</span>
            <strong className="text-red-600">{formatEpoch(data.deregistered_on)}</strong>
          </div>
        )}
      </div>

      {/* Registration Form Card */}
      <Card className="w-full border shadow-sm pt-0">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl text-center pt-5">
            {clubName}
          </CardTitle>
          <CardDescription className="text-center">
            Member Registration Form
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 px-8">
          <div key={data.pages[currentPageIndex].page_index} className="space-y-6">
            <h3 className="text-xl font-semibold text-center border-b pb-3">
              {data.pages[currentPageIndex].page_header}
            </h3>
            
            <div className="h-[500px] overflow-y-auto space-y-6 px-2">
              {data.pages[currentPageIndex].fields.map((field: { type: string; label: string; value: string; signature_type?: string; quantity?: number }) => {

              if (field.type === "STANDARD_SIGNATURE") {
                if (field.signature_type === "signature") {
                  return (
                    <div key={field.label} className="flex flex-col gap-2 p-4 bg-muted/20 rounded-lg">
                      <Label className="text-sm font-semibold text-muted-foreground">{field.label}</Label>
                      <img
                        src={field.value}
                        alt="User Signature"
                        className="border-b-2 border-gray-400 max-w-xs"
                      />
                    </div>
                  )
                } else {
                  return (
                    <div key={field.label} className="flex flex-col gap-2 p-4 bg-muted/20 rounded-lg">
                      <Label className="text-sm font-semibold text-muted-foreground">{field.label}</Label>
                      <Label className="text-base font-[cursive] border-b-2 border-gray-400 pb-1">
                        {field.value}
                      </Label>
                    </div>
                  )
                }
              }

              if (field.type === "STANDARD_OTHER") {
                return (
                  <div key={field.label} className="flex flex-col gap-2 p-4 bg-muted/20 rounded-lg">
                    <Label className="text-sm font-semibold text-muted-foreground">{field.label}</Label>
                    <Label className="text-base border-b-2 border-gray-300 pb-1">
                      {field.value}
                    </Label>
                  </div>
                );
              }

              if (field.type === "BILLING") {
                return (
                  <div key={field.label} className="flex flex-col gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-sm font-semibold text-blue-700">
                      {field.label} {field.quantity ? `(x${field.quantity})` : null}
                    </Label>
                    <Label className="text-base font-medium text-blue-900 border-b-2 border-blue-300 pb-1">
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
                    className="prose prose-sm max-w-none text-gray-700 p-4 bg-muted/10 rounded-lg [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5"
                    dangerouslySetInnerHTML={{ __html: cleaned }}
                  />
                );
              }

              if (field.type === "DNE") {
                return (
                  <div key={field.label} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border border-dashed">
                    <Label className="text-sm font-semibold text-muted-foreground">{field.label}</Label>
                    <Label className="text-sm italic text-gray-500">
                      Not filled in by member.
                    </Label>
                  </div>
                );
              }

            })}
          </div>

          {/* Pagination Controls */}
          {data.pages.length > 1 && (
            <div className="flex justify-between items-center pt-4 border-t">
              {currentPageIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-[100px]"
                  onClick={() => setCurrentPageIndex((i) => i - 1)}
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}

              <div className="text-sm text-muted-foreground">
                Page {currentPageIndex + 1} of {data.pages.length}
              </div>

              {currentPageIndex < data.pages.length - 1 ? (
                <Button
                  type="button"
                  className="w-[100px]"
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
