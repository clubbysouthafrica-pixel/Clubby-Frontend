import { useFetchRegistrationForm } from "@/queries/registration-form";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import RegistrationSuccessful from "@/components/shared/registration/registration-successful";
import {
  createValidRegistrationRequest,
  type SubmitRegistrationRequest,
} from "../../../helpers/admin/registration/create-registration-request";
import { getFieldName } from "@/helpers/members/registration/get-field-name";
import { useMemberRegistrationMutation } from "@/mutations/admin/useMemberRegistrationMutation";
import {
  ReusableRegistrationForm,
  FormPage,
  PagedFormPayload,
  PageFieldBase,
} from "../../shared/registration/reusable-registration-form";
import { ReusableSubmitRegistration } from "../../shared/registration/reusable-submit-registration";
import { CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
interface RegistrationFormProps {
  clubName: string;
  email: string;
  firstName: string;
  surname: string;
  clubAccountId: string;
  clubCurrency?: string;
  onEditDetails: () => void;
  onSuccess?: () => void;
}

export function PublicRegistrationForm({
  clubName,
  email,
  firstName: _firstName,
  surname: _surname,
  clubAccountId,
  clubCurrency = "ZAR",
  onEditDetails,
}: RegistrationFormProps) {
  const { data, isLoading } = useFetchRegistrationForm(clubAccountId);
  const { mutate, isSuccess } = useMemberRegistrationMutation();

  const firstName = _firstName;
  const surname = _surname;
  
  const [pages, setPages] = useState<FormPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requiredFieldsMissing, setRequiredFieldsMissing] = useState(false);
  const [registrationRequest, setRegistrationRequest] = useState<
    SubmitRegistrationRequest | undefined
  >(undefined);
  const [totalRegistrationFee, setTotalRegistrationFee] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!(data as PagedFormPayload)?.pages) return;

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
  }, [data]);

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
        if (f.field_type === "BILLING" && f.input_type === "NUMBER") return f.value == null || (typeof f.value === "number" && f.value <= 0);
      }
      return false;
    });

    if (missingOnCurrent.length > 0) {
      setRequiredFieldsMissing(true);
      return;
    }

    setRequiredFieldsMissing(false);
    setCurrentPageIndex((i) => i + 1);
    // Smoothly scroll to top when navigating to the next page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContinue = () => {
    registerUser();
  };

  const registerUser = async () => {
    if (missingRequired.length > 0) {
      setRequiredFieldsMissing(true);
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
    const request: SubmitRegistrationRequest = createValidRegistrationRequest(
      allFields,
      clubAccountId,
      email,
      surname,
      firstName
    );
    setRegistrationRequest(request);

    let total = 0;
    request.billing_fields.forEach((field) => {
      total += Number(field.value ?? 0);
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
        onError: (error) => {
          let message = "Registration failed";
          if (error && typeof error === "object") {
            const err = error as {
              response?: { data?: { message?: string } };
              message?: string;
            };
            message = err.response?.data?.message ?? err.message ?? message;
          }
          toast.error(message);
          setIsRegistering(false);
        },
      });
    }
  };

  const returnBackToRegistrationForm = () => {
    setRegistrationRequest(undefined);
    setTotalRegistrationFee(0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-5 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-2">
        <RegistrationSuccessful
          title={`Registration successful!`}
          message={`Your registration has been submitted. Please check your email for further instructions.`}
          onClose={onEditDetails}
        />
      </div>
    );
  }

  // Confirmation state (billing summary)
  if (registrationRequest) {
    return (
      <ReusableSubmitRegistration
        firstName={firstName}
        surname={surname}
        email={email}
        showMemberInfo={true}
        clubName={clubName}
        clubCurrency={clubCurrency}
        totalRegistrationFee={totalRegistrationFee}
        billingFields={registrationRequest.billing_fields.map((f) => ({
          field_id: f.field_id,
          value: f.value,
          label: f.label,
        }))}
        getFieldName={(fieldId) => getFieldName(pages, fieldId)}
        onBack={returnBackToRegistrationForm}
        onSubmit={submitRegistration}
        isSubmitting={isRegistering}
        showPaymentWarning={true}
        bottomContent={
          <div className="text-center text-xs mt-2 pt-2 border-t mx-4">
            <button
              type="button"
              onClick={onEditDetails}
              className="underline underline-offset-4"
            >
              Edit your details
            </button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      <CardHeader className=" pb-1">
        <h1 className="text-l text-center pt-2">
          Name:{" "}
          <strong>
            {firstName} {surname}
          </strong>
        </h1>
        <h1 className="text-l text-center">
          Email: <strong>{email}</strong>
        </h1>
      </CardHeader>

      {pages.length > 0 && (
        <ReusableRegistrationForm
          clubName={clubName}
          clubCurrency={clubCurrency}
          headerDescription={
            "Please complete all required fields to proceed with your registration."
          }
          pages={pages}
          currentPageIndex={currentPageIndex}
          setCurrentPageIndex={setCurrentPageIndex}
          setFieldValue={setFieldValue}
          requiredFieldsMissing={requiredFieldsMissing}
          showHeader={true}
          onNext={handleNextPage}
          onContinue={handleContinue}
          isPending={isRegistering}
          showNavigation={true}
          bottomContent={
            <div className="text-center text-xs mt-2 pt-2 border-t">
              <button
                type="button"
                onClick={onEditDetails}
                className="underline underline-offset-4"
              >
                Edit your details
              </button>
            </div>
          }
          className=""
        />
      )}
    </div>
  );
}
