// UI primitives are used inside child components; keep imports minimal here
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useFetchRegistrationForm } from "@/queries/registration-form";
import { RegistrationRequest } from "@/requests/registration-request";
import { useMemberRegistrationMutation } from "@/mutations/useMemberRegistrationMutation";
import { toast } from "sonner";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { createValidRegistrationRequest } from "../../../helpers/members/registration/create-registration-request";
import { getFieldName } from "../../../helpers/members/registration/get-field-name";
import {
  ReusableRegistrationForm,
  FormPage,
  PageFieldBase,
} from "../../shared/registration/reusable-registration-form";
import { ReusableSubmitRegistration } from "../../shared/registration/reusable-submit-registration";

async function presignedUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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

export function ClubRegisterForm() {
  const { user } = useContext(AuthContext) as AuthContextType;
  const { clubId } = useParams();
  const navigate = useNavigate();

  const { mutate, isPending } = useMemberRegistrationMutation();
  const { data, isLoading } = useFetchRegistrationForm(clubId as string);

  const [email, setEmail] = useState("");
  const [pages, setPages] = useState<FormPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requiredFieldsMissing, setRequiredFieldsMissing] = useState(false);
  const [registrationRequest, setRegistrationRequest] = useState<
    RegistrationRequest | undefined
  >(undefined);
  const [totalRegistrationFee, setTotalRegistrationFee] = useState(0);
  const [successfulRegistration, setSuccessfulRegistration] = useState<SuccessfulRegistrationPayload | null>(null);
  const [clubCurrency, setClubCurrency] = useState("");
  const [clubName, setClubName] = useState("");
  const [clubProfileUrl, setClubProfileUrl] = useState("");

  const hasEmptyStandardValue = (value?: string | number) =>
    typeof value !== "string" || value.trim() === "";

  useEffect(() => {
    if (data?.currency) {
      setClubCurrency(data.currency);
    }
    if (data?.club_name) {
      setClubName(data.club_name);
    }
    if (data?.club_profile_url) {
      setClubProfileUrl(data.club_profile_url);
    }
  }, [data?.currency, data?.club_name, data?.club_profile_url]);

  useEffect(() => {
    const processSignatures = async () => {
      if (!data?.pages) return;
      
      const updatedPages = await Promise.all(
        data.pages.map(async (page: FormPage) => ({
          ...page,
          fields: await Promise.all(
            page.fields.map(async (field: PageFieldBase) => {
              if (
                field?.field_type === "STANDARD" &&
                field?.input_type === "SIGNATURE" &&
                field?.signature_type === "signature" &&
                typeof field.value === "string" && field.value
              ) {
                const dataUrl = await presignedUrlToDataUrl(field.value);
                return { ...field, value: dataUrl };
              }
              return field;
            })
          ),
        }))
      );
      
      setPages(updatedPages);
    };
    
    processSignatures();
  }, [data?.pages]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const registerUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setRequiredFieldsMissing(true);
      try {
        const firstMissingPage = missingRequired[0]?.page;
        if (typeof firstMissingPage === "number") {
          setCurrentPageIndex(firstMissingPage);
        }
      } catch {
        // noop - stay on current page and show alert
      }
      return;
    }

    const allFields = pages.flatMap((p) => p.fields);

    const request: RegistrationRequest = createValidRegistrationRequest(
      allFields,
      clubId as string
    );

    if (!user) {
      (request as RegistrationRequest & { email?: string }).email = email;
    }
    setRegistrationRequest(request);

    let total = 0;
    request.billing_fields.forEach((field) => {
      total += field.value;
    });
    setTotalRegistrationFee(total);
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

    navigate(`/clubs/${clubId}/payments?${queryParams.toString()}`, {
      state: { registrationSuccess: true, registrationEmail: email, eftEnabled: !!(bank && account_number) },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successfulRegistration]);

  const submitRegistration = (emailOptIn: boolean) => {
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
        },
        onError: (error) => {
          let message = "Registration failed";
          if (error && typeof error === "object") {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            message = err.response?.data?.message ?? err.message ?? message;
          }
          toast.error(message);
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

  if (isLoading || !data?.pages || !data?.currency  || !data?.club_name) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!registrationRequest) {
    return (
      <ReusableRegistrationForm
        clubName={clubName || data?.club_name || ""}
        clubProfileUrl={clubProfileUrl}
        clubCurrency={clubCurrency || data?.currency || ""}
        pages={pages}
        currentPageIndex={currentPageIndex}
        setCurrentPageIndex={setCurrentPageIndex}
        setFieldValue={setFieldValue}
        requiredFieldsMissing={requiredFieldsMissing}
        headerTitle={`Register to ${clubName || data?.club_name || ""}`}
        headerDescription="Finish the registration form below"
        showHeader={true}
        topContent={
          !user ? (
            <div className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
              <Label
                htmlFor="user_email"
                className="text-xs font-semibold text-muted-foreground"
              >
                Email Address
              </Label>
              <Input
                id="user_email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          ) : null
        }
        bottomContent={
          <div className="text-center text-xs mt-2 pt-2 border-t">
            Go back to club?{" "}
            <Link
              to={`/clubs/${clubId}`}
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
      />
    );
  }

  return (
    <div className="flex justify-center items-center py-8">
      <ReusableSubmitRegistration
        publicEmailOptIn={false}
        showMemberInfo={false}
        clubName={clubName || data?.club_name || ""}
        clubProfileUrl={clubProfileUrl}
        clubCurrency={clubCurrency || data?.currency || ""}
        totalRegistrationFee={totalRegistrationFee}
        billingFields={registrationRequest.billing_fields.map((f) => ({
          field_id: f.field_id,
          value: f.value,
        }))}
        getFieldName={(fieldId) => getFieldName(pages, fieldId)}
        onBack={returnBackToRegistrationForm}
        onSubmit={submitRegistration}
        isSubmitting={isPending}
        showPaymentWarning={true}
        className="w-[800px] border shadow-sm"
        bottomContent={
          <div className="text-center text-xs mt-2 pt-2 border-t">
            Go back to club?{" "}
            <Link
              to={`/clubs/${clubId}`}
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
