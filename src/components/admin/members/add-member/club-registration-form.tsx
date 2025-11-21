import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useFetchRegistrationForm } from "@/queries/admin/registration-form";
import { useFetchClub } from "@/queries/admin/clubs";
import { AdminRegistrationRequest } from "@/requests/registration-request";
import { useMemberRegistrationMutation } from "@/mutations/admin/useMemberRegistrationMutation";
import { createValidRegistrationRequest } from "../../../../helpers/admin/registration/create-registration-request";
import { getFieldName } from "../../../../helpers/members/registration/get-field-name";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import {
  ReusableRegistrationForm,
  FormPage,
  PagedFormPayload,
  PageFieldBase,
} from "../../../shared/registration/reusable-registration-form";
import { ReusableSubmitRegistration } from "../../../shared/registration/reusable-submit-registration";
import RegistrationSuccessful from "@/components/shared/registration/registration-successful";
import { toast } from "sonner";

export function ClubRegisterForm({
  className,
  setShowRegistrationForm,
  memberEmail,
  memberFirstName,
  memberSurname,
  ...props
}: React.ComponentProps<"div"> & {
  memberEmail: string;
  memberFirstName: string;
  memberSurname: string;
  setShowRegistrationForm: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { club } = useContext(ClubContext) as ClubContextType;
  const { mutate, isPending, isSuccess } = useMemberRegistrationMutation();
  const { data, isLoading } = useFetchRegistrationForm(
    club?.club_account_id as string
  );
  const { data: clubDetails, isLoading: clubLoading } = useFetchClub(
    club?.club_account_id as string
  );

  const [pages, setPages] = useState<FormPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requiredFieldsMissing, setRequiredFieldsMissing] = useState(false);
  const [registrationRequest, setRegistrationRequest] = useState<
    AdminRegistrationRequest | undefined
  >(undefined);
  const [totalRegistrationFee, setTotalRegistrationFee] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if ((data as PagedFormPayload)?.pages) {
      const sorted = (data as PagedFormPayload).pages
        .sort((a, b) => a.page_index - b.page_index)
        .map((p, index) => ({
          ...p,
          page_index: index,
          fields: p.fields
            .sort((a, b) => Number(a.field_order_id) - Number(b.field_order_id))
            .map((f) => ({ ...f })),
        }));
      setPages(sorted);

      if (clubDetails?.meta) {
        const updatedPages = sorted.map((page) => ({
          ...page,
          fields: page.fields.map((field) => {
            const metaField = clubDetails.meta[field.field_id];
            if (!metaField) return field;

            if (field.billingOptions) {
              const matchedOption = field.billingOptions.find(
                (opt) => opt.option_order_id === metaField.option_order_id
              );

              if (matchedOption) {
                return {
                  ...field,
                  value: matchedOption.label,
                  label: matchedOption.label,
                  selectedAmountCents: matchedOption.amount,
                  option_order_id: matchedOption.option_order_id,
                };
              }
            } else {
              return {
                ...field,
                value: metaField.value,
              };
            }

            return field;
          }),
        }));
        setPages(updatedPages);
      }
    }
  }, [data, club, clubDetails?.meta]);

  const setFieldValue = (
    pageIndex: number,
    fieldId: string,
    updater: (f: PageFieldBase) => PageFieldBase
  ) => {
    if (requiredFieldsMissing) setRequiredFieldsMissing(false);
    setPages((prev) =>
      prev.map((p) =>
        p.page_index === pageIndex
          ? {
              ...p,
              fields: p.fields.map((f) =>
                f.field_id === fieldId ? updater(f) : f
              ),
            }
          : p
      )
    );
  };

  const missingRequired = useMemo(() => {
    const missing: { page: number; field: PageFieldBase }[] = [];
    for (const p of pages) {
      for (const f of p.fields) {
        if (f.field_type === "STANDARD" && f.required) {
          if (f.input_type === "CHECKBOX") {
            if (!f.value || f.value !== "true")
              missing.push({ page: p.page_index, field: f });
          } else {
            if (!f.value || f.value.trim() === "")
              missing.push({ page: p.page_index, field: f });
          }
        }
        if (f.field_type === "BILLING" && f.required) {
          if (f.input_type === "DROPDOWN") {
            if (f.value == null || f.selectedAmountCents == null)
              missing.push({ page: p.page_index, field: f });
          }
        }
      }
    }
    return missing;
  }, [pages]);

  const handleNextPage = () => {
    const currentPage = pages[currentPageIndex];
    const missingOnCurrent = currentPage.fields.filter((f) => {
      if (f.required) {
        if (f.field_type === "STANDARD") return !f.value?.trim();
        if (f.field_type === "BILLING" && f.input_type === "DROPDOWN")
          return f.value == null || f.selectedAmountCents == null;
      }
      return false;
    });

    if (missingOnCurrent.length > 0) {
      setRequiredFieldsMissing(true);
      return;
    }

    setRequiredFieldsMissing(false);
    setCurrentPageIndex((i) => i + 1);
    // Scroll to top when navigating to the next page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const registerUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setRequiredFieldsMissing(true);
      // If there are missing required fields on other pages,
      // navigate to the first page that contains a missing required field
      // so the user can fill it in.
      try {
        const firstMissingPage = missingRequired[0]?.page;
        if (typeof firstMissingPage === "number") {
          setCurrentPageIndex(firstMissingPage);
        }
      } catch {
        // noop - fall back to staying on current page and showing the alert
      }
      return;
    }

    const allFields = pages.flatMap((p) => p.fields);

    const request: AdminRegistrationRequest = createValidRegistrationRequest(
      allFields,
      club?.club_account_id as string,
      memberEmail,
      memberSurname,
      memberFirstName
    );

    setRegistrationRequest(request);

    let total = 0;
    request.billing_fields.forEach((field) => {
      total += field.value;
    });
    setTotalRegistrationFee(total);
  };

  const submitRegistration = () => {
    setIsRegistering(true);
    if (registrationRequest) {
      mutate(registrationRequest, {
        onSuccess: () => {
          setIsRegistering(false);
        },
        onError: (error: unknown) => {
          const errorMessage =
            (
              error as {
                response?: { data?: { message?: string } };
                message?: string;
              }
            )?.response?.data?.message || "Registration failed";
          toast.error(errorMessage);
          setIsRegistering(false);
        },
      });
    }
  };

  const handleContinue = () => {
    const syntheticEvent = {
      preventDefault: () => {},
    } as FormEvent<HTMLFormElement>;
    registerUser(syntheticEvent);
  };

  const returnBackToRegistrationForm = () => {
    setRegistrationRequest(undefined);
    setTotalRegistrationFee(0);
  };

  if (clubLoading && isLoading) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="w-[800px] border shadow-sm pt-0">
          <CardContent className="py-8">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div
        className={cn("flex flex-col gap-6 items-start", className)}
        {...props}
      >
        <RegistrationSuccessful
          title={`Registration successful!`}
          message={`The member has been registered. You can add another member or return.`}
          onClose={() => setShowRegistrationForm(false)}
          alignLeft
        />
      </div>
    );
  }

  if (!registrationRequest) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="w-[800px] gap-2 border shadow-sm pt-0">
          <CardHeader className="border-b bg-muted/30 py-1 pb-1">
            <h1 className="text-l text-center pt-2">
              Name:{" "}
              <strong>
                {memberFirstName} {memberSurname}
              </strong>
            </h1>
            <h1 className="text-l text-center">
              Email: <strong>{memberEmail}</strong>
            </h1>
            <CardDescription className="text-center text-xs">
              Finish the registration form to register this member.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-0 px-0">
            <ReusableRegistrationForm
              clubName={club?.club_name || ""}
              clubCurrency={club?.currency || ""}
              pages={pages}
              currentPageIndex={currentPageIndex}
              setCurrentPageIndex={setCurrentPageIndex}
              setFieldValue={setFieldValue}
              requiredFieldsMissing={requiredFieldsMissing}
              showHeader={false}
              bottomContent={
                <div className="text-center text-xs mt-2 pt-2 border-t">
                  <Link
                    to="/manage/members/add"
                    onClick={() => setShowRegistrationForm(false)}
                    className="underline underline-offset-4"
                  >
                    Cancel
                  </Link>
                </div>
              }
              onNext={handleNextPage}
              onContinue={handleContinue}
              isPending={isPending}
              showNavigation={true}
              className="border-none shadow-none py-0"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <ReusableSubmitRegistration
        firstName={memberFirstName}
        surname={memberSurname}
        email={memberEmail}
        showMemberInfo={true}
        clubName={club?.club_name || ""}
        clubCurrency={club?.currency || ""}
        totalRegistrationFee={totalRegistrationFee}
        billingFields={registrationRequest.billing_fields.map((f) => ({
          field_id: f.field_id,
          value: f.value,
        }))}
        getFieldName={(fieldId) => getFieldName(pages, fieldId)}
        onBack={returnBackToRegistrationForm}
        onSubmit={submitRegistration}
        isSubmitting={isRegistering}
        headerDescription="Review and submit the registration"
        submitButtonText="Register member"
        showPaymentWarning={true}
        className="w-[800px] border shadow-sm"
        bottomContent={
          <div className="text-center text-xs mt-2 pt-2 border-t">
            <Link
              to="/manage/members/add"
              onClick={() => setShowRegistrationForm(false)}
              className="underline underline-offset-4"
            >
              Cancel
            </Link>
          </div>
        }
      />
    </div>
  );
}
