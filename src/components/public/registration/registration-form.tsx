import { useFetchRegistrationForm } from "@/queries/registration-form";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type SuccessfulRegistrationPayload = {
  message?: string;
  transaction_id?: string;
  registration_id?: string;
  id?: string;
  user_id?: string;
  amount?: number;
  payment_reference?: string;
  account_number?: string;
  account_type?: string;
  bank?: string;
  branch_code?: string;
  payfast_enabled?: boolean;
  snapscan_enabled?: boolean;
};
interface RegistrationFormProps {
  clubName: string;
  clubProfileUrl?: string;
  email: string;
  firstName: string;
  surname: string;
  clubAccountId: string;
  clubCurrency?: string;
  onEditDetails: () => void;
  onSuccess?: () => void;
  onAlreadyRegistered?: () => void;
}

export function PublicRegistrationForm({
  clubName,
  clubProfileUrl,
  email,
  firstName: _firstName,
  surname: _surname,
  clubAccountId,
  clubCurrency = "ZAR",
  onEditDetails,
  onAlreadyRegistered,
}: RegistrationFormProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useFetchRegistrationForm(clubAccountId, email);
  const { mutate } = useMemberRegistrationMutation();

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
  const [successfulRegistration, setSuccessfulRegistration] = useState<
    SuccessfulRegistrationPayload | null
  >(null);

  const hasEmptyStandardValue = (value?: string | number) =>
    typeof value !== "string" || value.trim() === "";

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
            if (hasEmptyStandardValue(f.value))
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

  const missingFieldNames = useMemo(() => {
    const currentPage = pages[currentPageIndex];
    if (!currentPage) return [];
    
    return currentPage.fields
      .filter((f) => {
        if (f.required) {
          if (f.field_type === "STANDARD") return hasEmptyStandardValue(f.value);
          if (f.field_type === "BILLING" && f.input_type === "DROPDOWN")
            return f.value == null || f.selectedAmountCents == null;
          if (f.field_type === "BILLING" && f.input_type === "NUMBER") 
            return f.value == null || (typeof f.value === "number" && f.value <= 0);
        }
        return false;
      })
      .map((f) => f.field_name);
  }, [pages, currentPageIndex]);

  const handleNextPage = () => {
    const currentPage = pages[currentPageIndex];
    const missingOnCurrent = currentPage.fields.filter((f) => {
      if (f.required) {
        if (f.field_type === "STANDARD") return hasEmptyStandardValue(f.value);
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

  const submitRegistration = (emailOptIn: boolean) => {
    setIsRegistering(true);
    if (registrationRequest) {
      mutate({
        ...registrationRequest,
        email_opt_in: emailOptIn,
      }, {
        onSuccess: (response) => {
          setSuccessfulRegistration(
            response && typeof response === "object"
              ? (response as SuccessfulRegistrationPayload)
              : {},
          );
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

  useEffect(() => {
    if (!successfulRegistration) return;

    const queryParams = new URLSearchParams();
    queryParams.set("paymentScreen", "true");

    const { transaction_id, registration_id, id, user_id, amount, payment_reference, account_number, account_type, bank, branch_code, payfast_enabled, snapscan_enabled } = successfulRegistration;

    if (transaction_id) queryParams.set("transactionId", transaction_id);
    if (registration_id || id) queryParams.set("registrationId", (registration_id || id)!);
    if (user_id) queryParams.set("userId", user_id);
    if (typeof amount === "number") queryParams.set("amount", String(amount));
    if (payment_reference) queryParams.set("paymentReference", payment_reference);
    if (bank) queryParams.set("bank", bank);
    if (account_number) queryParams.set("accountNumber", account_number);
    if (account_type) queryParams.set("accountType", account_type);
    if (branch_code) queryParams.set("branchCode", branch_code);
    if (typeof payfast_enabled === "boolean") queryParams.set("payfastEnabled", String(payfast_enabled));
    if (typeof snapscan_enabled === "boolean") queryParams.set("snapscanEnabled", String(snapscan_enabled));

    navigate(`/clubs/${clubAccountId}/payments?${queryParams.toString()}`, {
      state: { registrationSuccess: true, registrationEmail: email, eftEnabled: !!(bank && account_number) },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successfulRegistration]);

  const isAlreadyRegistered =
    error !== null &&
    typeof error === "object" &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 409;

  useEffect(() => {
    if (isAlreadyRegistered) onAlreadyRegistered?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAlreadyRegistered]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-5 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAlreadyRegistered) {
    const apiMessage =
      (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
      "You already have a pending or active registration with this club.";

    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">Already Registered</h2>
          <p className="max-w-sm text-sm text-slate-500">{apiMessage}</p>
        </div>
        <button
          onClick={() => navigate(`/clubs/${clubAccountId}`)}
          className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Back to {clubName}
        </button>
      </div>
    );
  }

  if (registrationRequest) {
    return (
      <ReusableSubmitRegistration
        publicEmailOptIn={false}
        firstName={firstName}
        surname={surname}
        email={email}
        showMemberInfo={true}
        clubName={clubName}
        clubProfileUrl={clubProfileUrl}
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
    <div className="">
      {pages.length > 0 && (
        <ReusableRegistrationForm
          clubName={clubName}
          clubProfileUrl={clubProfileUrl}
          clubCurrency={clubCurrency}
          textFieldClassName="bg-transparent rounded-none border-0 p-0 text-slate-900 shadow-none prose-base leading-7 [&_p]:text-slate-900 [&_p]:leading-7 [&_strong]:text-slate-950 [&_strong]:font-semibold [&_em]:text-slate-800 [&_li]:text-slate-900 [&_li]:leading-7"
          headerDescription={
            "Please complete all required fields to proceed with your registration."
          }
          pages={pages}
          currentPageIndex={currentPageIndex}
          setCurrentPageIndex={setCurrentPageIndex}
          setFieldValue={setFieldValue}
          requiredFieldsMissing={requiredFieldsMissing}
          missingFieldNames={missingFieldNames}
          showHeader={true}
          afterHeaderContent={
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 lg:px-10 py-4 lg:py-5 space-y-1">
                <h1 className="text-sm lg:text-base font-semibold text-gray-900">
                  Name: <strong>{firstName} {surname}</strong>
                </h1>
                <h1 className="text-sm lg:text-base font-semibold text-gray-900">
                  Email: <strong>{email}</strong>
                </h1>
              </div>
            </div>
          }
          onNext={handleNextPage}
          onContinue={handleContinue}
          isPending={isRegistering}
          showNavigation={true}
          bottomContent={
            <div className="text-center text-sm mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onEditDetails}
                className="text-black hover:text-gray-700 underline underline-offset-4 font-medium"
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
