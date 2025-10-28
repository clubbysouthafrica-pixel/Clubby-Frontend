import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useFetchMemberRegisteration } from "@/queries/registration-form";
import { Loader2 } from "lucide-react";
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

  if (isLoading || !data) {
    return (
      <div className="p-5 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  return (
    <Card className="w-full mb-4 border-none shadow-none">
      <CardContent className="py-0 px-8 space-y-8">
        <div key={data.pages[currentPageIndex].page_index} className="flex flex-col gap-1 justify-center items-center">
          <CardDescription className="text-center w-[85%]">
            This is your most recent registration form submitted for <strong>{clubName}</strong>. <></>
            {membershipStatus === "Pending" ? (
              <>
                Your registration is currently <strong>pending</strong>. The club admin still needs to verify your submitted registration and confirm if your registration fee has been paid.
                {` `}
                If you haven’t paid yet, please visit <strong>Payments & Billing</strong> to complete the outstanding payment using a supported method.
                {` `}
                If your payment has already been made, please be patient while the admin completes the verification process.
              </>
            ) : membershipStatus === "Resubmission required" ? (
              <>
                Your registration requires a <strong>resubmission</strong>. This may be due to reasons such as your membership expiring, the club starting a new season, or invalid information in your previous submission. Please resubmit your registration form.
              </>
            ) : (
              <>
                Your registration has been <strong>successfully accepted</strong>, and your payment has been confirmed by the admin. You are now officially a member.
              </>
            )}
          </CardDescription>
          <div className="shadow-md p-4 w-[85%] border border-gray-200 rounded-lg bg-gray-50">
            <CardTitle className="text-xl text-center underline">
              {clubName}
            </CardTitle>
            <h3 className="text-[20px] font-semibold text-center">{data.pages[currentPageIndex].page_header}</h3>
            <div className="h-[50vh] mt-2 overflow-y-auto space-y-6">
              {data.pages[currentPageIndex].fields.map((field: any) => {

                if (field.type === "STANDARD_SIGNATURE") {
                  if (field.signature_type === "signature") {
                    return (
                      <div key={field.label} className="flex flex-col gap-2">
                        <Label className="text-[12px] font-semibold">{field.label}:</Label>
                        <img
                          src={field.value}
                          alt="User Signature"
                          className="border-b-2 border-gray-400 w-50"
                        />
                      </div>
                    )
                  } else {
                    return (
                      <div key={field.label} className="flex flex-col gap-2">
                        <Label className="text-[12px] font-semibold">{field.label}:</Label>
                        <Label className="text-[15px] font-[cursive] border-b-2 border-gray-400 pb-1 w-200">
                          {field.value}
                        </Label>
                      </div>
                    )
                  }
                }

                if (field.type === "STANDARD_OTHER") {
                  return (
                    <div key={field.label} className="flex flex-col gap-2">
                      <Label className="text-[12px] font-semibold">{field.label}:</Label>
                      <Label className="text-[12px] border-b-2 border-gray-300 pb-1 w-200">
                        {field.value}
                      </Label>
                    </div>
                  );
                }

                if (field.type === "BILLING") {
                  return (
                    <div key={field.label} className="flex flex-col gap-2">
                      <Label className="text-[12px] font-semibold">{field.label} {field.quantity ? `(x${field.quantity})` : null}:</Label>
                      <Label className="text-[12px] border-b-2 border-gray-300 pb-1 w-200">
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
                      className="prose text-gray-700 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5"
                      dangerouslySetInnerHTML={{ __html: cleaned }}
                    />
                  );
                }


                if (field.type === "DNE") {
                  return (
                    <div key={field.label} className="flex flex-col gap-2">
                      <Label className="text-[12px] font-semibold">{field.label}:</Label>
                      <Label className="text-[12px] border-b-2 border-gray-300 pb-1 w-200 text-gray-500">
                        Not filled in by member.
                      </Label>
                    </div>
                  );
                }

              })}
            </div>
          </div>
        </div>
        {data.pages.length > 1 && (
          <div className="flex justify-between items-center mt-6 w-full">
            {currentPageIndex > 0 ? (
              <Button
                type="button"
                className="w-[100px]"
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
      </CardContent>
    </Card>
  );
}
