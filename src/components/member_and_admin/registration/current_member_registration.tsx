import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useState } from "react";
import { useFetchMemberRegisteration } from "@/queries/admin/registration-form";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export function CurrentMemberRegistration({
  userId,
  clubAccountId,
  currency,
}: { userId: string, clubAccountId: string, currency: string }) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { data, isLoading } = useFetchMemberRegisteration(
    clubAccountId,
    userId,
    currency
  );

  if (isLoading || !data) {
    return (
      <div className="p-5 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  return (
    <Card className="w-full">
      <CardContent className="py-0 px-8 space-y-8">
        <div key={data.pages[currentPageIndex].page_index} className="space-y-5">
          <h2 className="text-2xl font-bold text-center mb-6 mt-0">
            {data.pages[currentPageIndex].page_header}
          </h2>
          <div className="max-h-[30vh] overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-6">
            {data.pages[currentPageIndex].fields.map((field: any) => {

              if (field.type === "STANDARD_SIGNATURE") {
                if (field.signature_type === "signature") {
                  return (
                    <div key={field.label} className="flex flex-col gap-2">
                      <Label className="text-[15px] font-semibold">{field.label}:</Label>
                      <img
                        src={field.value}
                        alt="User Signature"
                        className="border-b-2 border-gray-400 w-64"
                      />
                    </div>
                  )
                } else {
                  return (
                    <div key={field.label} className="flex flex-col gap-2">
                      <Label className="text-[15px] font-semibold">{field.label}:</Label>
                      <Label className="text-[15px] font-[cursive] border-b-2 border-gray-400 pb-1 w-64">
                        {field.value}
                      </Label>
                    </div>
                  )
                }
              }

              if (field.type === "STANDARD_OTHER") {
                return (
                  <div key={field.label} className="flex flex-col gap-2">
                    <Label className="text-[15px] font-semibold">{field.label}:</Label>
                    <Label className="text-[15px] border-b-2 border-gray-300 pb-1 w-64">
                      {field.value}
                    </Label>
                  </div>
                );
              }

              if (field.type === "BILLING") {
                return (
                  <div key={field.label} className="flex flex-col gap-2">
                    <Label className="text-[15px] font-semibold">{field.label} {field.quantity ? `(x${field.quantity})` : null}:</Label>
                    <Label className="text-[15px] border-b-2 border-gray-300 pb-1 w-64">
                      {field.value}
                    </Label>
                  </div>
                );
              }

              if (field.type === "TEXT") {
                return (
                  <p key={field.label} className="text-sm text-muted-foreground">
                    {field.label}
                  </p>
                );
              }

            })}
          </div>
        </div>
        {data.pages.length > 1 && (
          <div className="flex justify-between items-center mt-6 w-full">
            {currentPageIndex > 0 ? (
              <Button
                type="button"
                className="px-6 py-2"
                onClick={() => setCurrentPageIndex((i) => i - 1)}
              >
                Previous
              </Button>
            ) : (
              <div />
            )}

            {currentPageIndex < data.pages.length - 1 ? (
              <Button
                type="button"
                className="px-6 py-2"
                onClick={() => setCurrentPageIndex((i) => i + 1)}
              >
                Next
              </Button>
            ) : (
              <div />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
