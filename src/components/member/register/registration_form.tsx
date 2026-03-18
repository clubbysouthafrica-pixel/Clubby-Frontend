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
import RegistrationSuccessful from "@/components/shared/registration/registration-successful";
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

export function ClubRegisterForm() {
  const { user } = useContext(AuthContext) as AuthContextType;
  const { clubId } = useParams();
  const navigate = useNavigate();

  const {
    mutate,
    isPending,
    error: registerError,
    isSuccess,
  } = useMemberRegistrationMutation();
  const { data, isLoading } = useFetchRegistrationForm(clubId as string);

  const [email, setEmail] = useState("");
  const [pages, setPages] = useState<FormPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requiredFieldsMissing, setRequiredFieldsMissing] = useState(false);
  const [registrationRequest, setRegistrationRequest] = useState<
    RegistrationRequest | undefined
  >(undefined);
  const [totalRegistrationFee, setTotalRegistrationFee] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
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
        if (f.field_type === "BILLING" && f.input_type === "DISCOUNT")
          return f.value == null || f.percentage == null;
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

  const submitRegistration = () => {
    if (registrationRequest) {
      mutate(registrationRequest, {
        onSuccess: () => {
          setShowSuccess(true);
        },
        onError: () => {
          toast(registerError?.message ?? "Registration failed");
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

  if (showSuccess || isSuccess) {
    return (
      <div className="flex justify-center items-center py-8">
        <RegistrationSuccessful
          title={`Successfully Registered`}
          message={`Club will stay in contact with you once registration is completed.`}
          clubName={clubName}
          clubProfileUrl={clubProfileUrl}
          onClose={() => navigate(`/clubs/${clubId}`)}
        />
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
