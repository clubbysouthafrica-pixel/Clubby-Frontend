import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { countries } from "@/data/countries";
import { currencies } from "@/data/currencies";
import { useUpdateClubDetailsMutation } from "@/mutations/admin/club";
import { useFetchClubDetails } from "@/queries/admin/clubs";
import {
  Loader2,
  Mail,
  MapPin,
  Coins,
  CreditCard,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  REGISTRATION_SUBMISSION_EMAIL_TEMPLATE,
  REGISTRATION_SUCCESS_EMAIL_TEMPLATE,
} from "@/helpers/admin/constants/registration_submission_email_template";
import EditableEmailTemplate from "../../../components/admin/manage/emailing/editable_email_template";
import { BankingDetailsForm } from "@/components/admin/club/banking-details-form";

export default function EditClubDetails() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const { data, isLoading } = useFetchClubDetails(
    club?.club_account_id as string
  );
  const { mutate, isPending } = useUpdateClubDetailsMutation();

  const [activeTab, setActiveTab] = useState("club-view");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [clubUrl, setClubUrl] = useState("");
  const [hideFromPublic, setHideFromPublic] = useState<boolean>(false);

  const [
    registrationSubmissionEmailTemplate,
    setRegistrationSubmissionEmailTemplate,
  ] = useState<string>(REGISTRATION_SUBMISSION_EMAIL_TEMPLATE);
  const [
    registrationSuccessEmailTemplate,
    setRegistrationSuccessEmailTemplate,
  ] = useState<string>(REGISTRATION_SUCCESS_EMAIL_TEMPLATE);
  const [useSuccessEmailTemplate, setUseSuccessEmailTemplate] =
    useState<boolean>(false);
  const [useSubmissionEmailTemplate, setUseSubmissionEmailTemplate] =
    useState<boolean>(false);
  const [notifyOnMemberRegistration, setNotifyOnMemberRegistration] =
    useState<boolean>(false);

  useEffect(() => {
    if (data) {
      setCurrency(data?.currency);
      setCountry(data?.country_of_operation);
      setSupportEmail(data.support_email);
      setClubUrl(data?.club_url || "");
      setHideFromPublic(data?.hide_from_public ?? false);

      setRegistrationSubmissionEmailTemplate(
        data?.registration_submission_email_template_body ??
          REGISTRATION_SUBMISSION_EMAIL_TEMPLATE
      );
      setRegistrationSuccessEmailTemplate(
        data?.registration_success_email_template_body ??
          REGISTRATION_SUCCESS_EMAIL_TEMPLATE
      );
      setUseSubmissionEmailTemplate(
        data?.use_submission_email_template ?? false
      );
      setUseSuccessEmailTemplate(data?.use_success_email_template ?? false);
      setNotifyOnMemberRegistration(
        data?.notify_on_member_registration ?? true
      );
    }
  }, [data]);

  const handleBankingDetailsSave = (bankingData: {
    bank_details: {
      bank: string;
      account_number: string;
      branch_code: string;
      account_type: string;
    };
  }) => {
    mutate(
      {
        club_account_id: club?.club_account_id as string,
        bank_details: bankingData.bank_details,
        country_of_operation: country,
        currency,
        support_email: supportEmail,
        club_url: clubUrl,
        hide_from_public: hideFromPublic,
        registration_submission_email_template_body:
          registrationSubmissionEmailTemplate,
        registration_success_email_template_body:
          registrationSuccessEmailTemplate,
        use_success_email_template: useSuccessEmailTemplate,
        use_submission_email_template: useSubmissionEmailTemplate,
        notify_on_member_registration: notifyOnMemberRegistration,
      },
      {
        onSuccess: () => toast.success("Successfully updated club details"),
        onError: (error: unknown) => {
          const errorMessage =
            (
              error as {
                response?: { data?: { message?: string } };
                message?: string;
              }
            )?.response?.data?.message ||
            (error as { message?: string })?.message ||
            "Something went wrong";
          toast.error(errorMessage);
        },
      }
    );
  };
  const update = () =>
    mutate(
      {
        club_account_id: club?.club_account_id as string,
        bank_details: data?.bank_details || {
          bank: "",
          account_number: "",
          branch_code: "",
          account_type: "",
        },
        payfast_details: data?.payfast_details || {
          merchant_id: "",
          merchant_key: "",
          passphrase: "",
        },
        country_of_operation: country,
        currency,
        support_email: supportEmail,
        club_url: clubUrl,
        hide_from_public: hideFromPublic,
        registration_submission_email_template_body:
          registrationSubmissionEmailTemplate,
        registration_success_email_template_body:
          registrationSuccessEmailTemplate,
        use_success_email_template: useSuccessEmailTemplate,
        use_submission_email_template: useSubmissionEmailTemplate,
        notify_on_member_registration: notifyOnMemberRegistration,
      },
      {
        onSuccess: () => toast.success("Successfully updated club details"),
        onError: (error: unknown) => {
          const errorMessage =
            (
              error as {
                response?: { data?: { message?: string } };
                message?: string;
              }
            )?.response?.data?.message ||
            (error as { message?: string })?.message ||
            "Something went wrong";
          toast.error(errorMessage);
        },
      }
    );

  if (isLoading) {
    return (
      <div className="p-5 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex w-[80%] flex-col">
        {!isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="club-view">Club View</TabsTrigger>
              <TabsTrigger value="account">Banking & Payments</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="emailing">Emailing</TabsTrigger>
            </TabsList>

            {/* Club View Tab */}
            <TabsContent value="club-view">
              <Card className="border-0 shadow-none">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle>Club View</CardTitle>
                    <CardDescription>
                      Control details shown on the public club page. Optionally
                      set a Club URL to embed external content.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={update}
                  >
                    {isPending ? (
                      <p className="flex space-x-2 items-center">
                        <Loader2 className="animate-spin" />
                        <span>Saving...</span>
                      </p>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="club_url">Club URL (optional)</Label>
                    <Input
                      id="club_url"
                      type="url"
                      placeholder="https://example.com/club"
                      value={clubUrl}
                      onChange={(e) => setClubUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      If provided, this URL may be used on the public club page
                      for embedding or linking.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm">Public Listing</Label>
                    <p className="text-xs text-muted-foreground">
                      Control whether this club appears in the public Browse
                      Clubs list.
                    </p>
                    <div className="flex items-center gap-6 mt-1">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="publicVisibility"
                          value="public"
                          checked={!hideFromPublic}
                          onChange={() => setHideFromPublic(false)}
                          className="accent-primary"
                        />
                        <span>Public (listed)</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="publicVisibility"
                          value="hidden"
                          checked={hideFromPublic}
                          onChange={() => setHideFromPublic(true)}
                          className="accent-primary"
                        />
                        <span>Hidden (unlisted)</span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Support Email */}
                    <div
                      onClick={() => setActiveTab("emailing")}
                      className={`rounded-lg p-4 border-2 flex items-start gap-3 cursor-pointer transition-transform hover:scale-[1.02] ${
                        supportEmail
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                      }`}
                    >
                      <Mail
                        className={`h-5 w-5 mt-0.5 ${
                          supportEmail
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <Label className="text-xs font-semibold">
                          Support Email
                        </Label>
                        <p className="text-sm font-medium break-all">
                          {supportEmail || "Not set"}
                        </p>
                      </div>
                      {supportEmail ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* Country */}
                    <div
                      onClick={() => setActiveTab("location")}
                      className={`rounded-lg p-4 border-2 flex items-start gap-3 cursor-pointer transition-transform hover:scale-[1.02] ${
                        country
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                      }`}
                    >
                      <MapPin
                        className={`h-5 w-5 mt-0.5 ${
                          country
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      />
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs font-semibold">
                          Country of Operation
                        </Label>
                        <p className="text-sm font-medium">
                          {country || "Not set"}
                        </p>
                      </div>
                      {country ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* Currency */}
                    <div
                      onClick={() => setActiveTab("location")}
                      className={`rounded-lg p-4 border-2 flex items-start gap-3 cursor-pointer transition-transform hover:scale-[1.02] ${
                        currency
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                      }`}
                    >
                      <Coins
                        className={`h-5 w-5 mt-0.5 ${
                          currency
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      />
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs font-semibold">
                          Currency
                        </Label>
                        <p className="text-sm font-medium">
                          {currency || "Not set"}
                        </p>
                      </div>
                      {currency ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* PayFast */}
                    <div
                      onClick={() => setActiveTab("account")}
                      className={`rounded-lg p-4 border-2 flex items-start gap-3 cursor-pointer transition-transform hover:scale-[1.02] ${
                        data?.payfast_enabled
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                      }`}
                    >
                      <CreditCard
                        className={`h-5 w-5 mt-0.5 ${
                          data?.payfast_enabled
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      />
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs font-semibold">
                          PayFast Enabled
                        </Label>
                        <p className="text-sm font-medium">
                          {data?.payfast_enabled ? "Yes" : "No"}
                        </p>
                      </div>
                      {data?.payfast_enabled ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* Bank Details */}
                    <div
                      onClick={() => setActiveTab("account")}
                      className={`rounded-lg p-4 border-2 flex items-start gap-3 md:col-span-2 cursor-pointer transition-transform hover:scale-[1.02] ${
                        data?.bank_details
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                      }`}
                    >
                      <Building2
                        className={`h-5 w-5 mt-0.5 ${
                          data?.bank_details
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      />
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs font-semibold">
                          Bank Details
                        </Label>
                        <p className="text-sm font-medium">
                          {data?.bank_details ? "Configured" : "Missing"}
                        </p>
                      </div>
                      {data?.bank_details ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <BankingDetailsForm
                club_account_id={club?.club_account_id as string}
                bankDetails={data?.bank_details}
                payfastEnabled={data?.payfast_enabled}
                onSave={handleBankingDetailsSave}
                isPending={isPending}
              />
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location">
              <Card className="h-[630px] border-0 shadow-none">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle>Location</CardTitle>
                    <CardDescription>
                      Set the country the club is operating out of and preferred
                      currency. Save after updating.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={update}
                  >
                    {isPending ? (
                      <p className="flex space-x-2 items-center">
                        <Loader2 className="animate-spin" />
                        <span>Saving...</span>
                      </p>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label>Country of Operation</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {currencies.map((curr) => (
                              <SelectItem key={curr.code} value={curr.code}>
                                {curr.name} ({curr.code})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Emailing Tab */}
            <TabsContent value="emailing">
              <Card className="flex flex-col border-0 shadow-none">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle>Emailing</CardTitle>
                    <CardDescription>
                      Draft custom automated emails and handle member
                      communications.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={update}
                    disabled={isPending}
                    variant="outline"
                  >
                    {isPending ? (
                      <p className="flex space-x-2 items-center">
                        <Loader2 className="animate-spin" />
                        <span>Saving...</span>
                      </p>
                    ) : (
                      "Save email settings"
                    )}
                  </Button>
                </CardHeader>
                <Tabs defaultValue="support-email" className="px-5">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="support-email">
                      Support Email
                    </TabsTrigger>
                    <TabsTrigger value="registration-submission">
                      Registration Submission
                    </TabsTrigger>
                    <TabsTrigger value="registration-success">
                      Registration Success
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="support-email"
                    className="flex flex-col py-2 gap-2"
                  >
                    <CardTitle>Support Email</CardTitle>
                    <CardDescription>
                      Set the support email members can contact. This mailbox
                      will also receive a notification each time a member
                      submits a registration form.
                    </CardDescription>
                    <Input
                      id="tabs-demo-name"
                      type="text"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="Set support email"
                    />
                    <div className="flex items-center gap-3 mt-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-900">
                      <input
                        type="checkbox"
                        id="notify-registration"
                        checked={notifyOnMemberRegistration !== false}
                        onChange={(e) =>
                          setNotifyOnMemberRegistration(e.target.checked)
                        }
                        className="h-4 w-4 accent-primary rounded"
                      />
                      <Label
                        htmlFor="notify-registration"
                        className="cursor-pointer text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            Send email notification on new member registration
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            The support email will receive a notification
                            whenever a member successfully registers for a club
                            activity.
                          </p>
                        </div>
                      </Label>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="registration-submission"
                    className="flex flex-col py-2 gap-2"
                  >
                    <CardTitle>Registration Submission Email</CardTitle>
                    <CardDescription>
                      This is an editable draft of the email sent to a member
                      when they submit their registration. To insert the
                      member’s name, use <strong>{"{{member_name}}"}</strong>.
                    </CardDescription>
                    <EditableEmailTemplate
                      template={registrationSubmissionEmailTemplate}
                      clubName={club?.club_name ?? ""}
                      supportEmail={supportEmail}
                      setTemplate={setRegistrationSubmissionEmailTemplate}
                      useTemplate={useSubmissionEmailTemplate}
                      setUseTemplate={setUseSubmissionEmailTemplate}
                    />
                  </TabsContent>

                  <TabsContent
                    value="registration-success"
                    className="flex flex-col py-2 gap-2"
                  >
                    <CardTitle>Registration Success Email</CardTitle>
                    <CardDescription>
                      This is an editable draft of the email sent to a member
                      upon successful registration by the admin. To insert the
                      member’s name, use <strong>{"{{member_name}}"}</strong>.
                    </CardDescription>
                    <EditableEmailTemplate
                      template={registrationSuccessEmailTemplate}
                      clubName={club?.club_name ?? ""}
                      supportEmail={supportEmail}
                      setTemplate={setRegistrationSuccessEmailTemplate}
                      useTemplate={useSuccessEmailTemplate}
                      setUseTemplate={setUseSuccessEmailTemplate}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
