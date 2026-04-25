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
import { useFetchRegistrationForm } from "@/queries/admin/registration-form";
import { Loader2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  REGISTRATION_SUBMISSION_EMAIL_TEMPLATE,
  REGISTRATION_SUCCESS_EMAIL_TEMPLATE,
} from "@/helpers/admin/constants/registration_submission_email_template";
import { BankingDetailsForm } from "@/components/admin/club/manage-club/banking-details-form";
import ClubGalleryEdit from "./gallery";
import { Textarea } from "@/components/ui/textarea";
import { ClubVariablesForm } from "@/components/admin/club/manage-club/club-variables-form";
import { EmailSettingsForm } from "@/components/admin/club/manage-club/email-settings-form";
import {
  ClubVariable,
  RegistrationDropdownField,
} from "@/interfaces/club-variable";
import { toClubVariableRequest } from "@/requests/club-request";

export default function EditClubDetails({
  initialTab,
}: {
  initialTab?: string;
}) {
  const { club, setClub } = useContext(ClubContext) as ClubContextType;
  const { data, isLoading } = useFetchClubDetails(
    club?.club_account_id as string,
  );
  const { data: registrationFormData } = useFetchRegistrationForm(
    club?.club_account_id as string,
  );
  const { mutate, isPending } = useUpdateClubDetailsMutation();

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const defaultOpeningTimes = daysOfWeek.map((day) => ({
    day,
    open: "",
    close: "",
    closed: false,
  }));

  const [openingTimes, setOpeningTimes] = useState(defaultOpeningTimes);

  const [activeTab, setActiveTab] = useState("club-view");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [clubUrl, setClubUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [clubDetails, setClubDetails] = useState("");
  const [hideFromPublic, setHideFromPublic] = useState<boolean>(false);

  const [
    registrationSubmissionEmailTemplate,
    setRegistrationSubmissionEmailTemplate,
  ] = useState<string>(REGISTRATION_SUBMISSION_EMAIL_TEMPLATE);
  const [
    registrationSubmissionEmailSubject,
    setRegistrationSubmissionEmailSubject,
  ] = useState<string>("Registration Submission");
  const [
    registrationSuccessEmailTemplate,
    setRegistrationSuccessEmailTemplate,
  ] = useState<string>(REGISTRATION_SUCCESS_EMAIL_TEMPLATE);
  const [registrationSuccessEmailSubject, setRegistrationSuccessEmailSubject] =
    useState<string>("Registration Confirmed");
  const [useSuccessEmailTemplate, setUseSuccessEmailTemplate] =
    useState<boolean>(false);
  const [useSubmissionEmailTemplate, setUseSubmissionEmailTemplate] =
    useState<boolean>(false);
  const [notifyOnMemberRegistration, setNotifyOnMemberRegistration] =
    useState<boolean>(false);
  const [isBankingDetailsFormComplete, setIsBankingDetailsFormComplete] =
    useState<boolean>(false);
  const [clubVariables, setClubVariables] = useState<ClubVariable[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const registrationDropdownFields: RegistrationDropdownField[] =
    Array.isArray(registrationFormData?.pages)
      ? registrationFormData.pages.flatMap(
          (page: { fields?: Array<Record<string, any>> }) =>
            (page.fields ?? [])
              .filter(
                (field: Record<string, any>) =>
                  field.field_type === "STANDARD" &&
                  field.input_type === "DROPDOWN",
              )
              .map((field: Record<string, any>) => ({
                fieldId: String(field.field_id ?? field.field_name ?? ""),
                label: String(
                  field.field_name ?? field.label ?? field.field_id ?? "Dropdown field",
                ),
                options: Array.isArray(field.options)
                  ? field.options.map((option: unknown) => String(option))
                  : [],
              })),
        )
      : [];

  useEffect(() => {
    if (data && !isInitialized) {
      setCurrency(data?.currency);
      setCountry(data?.country_of_operation);
      setSupportEmail(data.support_email);
      setClubUrl(data?.club_url || "");
      setInstagramUrl(data?.instagram_url || "");
      setFacebookUrl(data?.facebook_url || "");
      setClubDetails(data?.about_club || "");
      setHideFromPublic(data?.hide_from_public ?? false);
      setInstagramUrl(data?.instagram_url || "");
      setFacebookUrl(data?.facebook_url || "");
      setClubDetails(data?.about_club || "");
      setOpeningTimes(data?.opening_times || defaultOpeningTimes);

      if (data?.opening_times && Array.isArray(data.opening_times)) {
        setOpeningTimes(data.opening_times);
      }

      setRegistrationSubmissionEmailTemplate(
        data?.registration_submission_email_template_body ??
          REGISTRATION_SUBMISSION_EMAIL_TEMPLATE,
      );
      setRegistrationSubmissionEmailSubject(
        data?.registration_submission_email_subject ??
          "Registration Submission",
      );
      setRegistrationSuccessEmailTemplate(
        data?.registration_success_email_template_body ??
          REGISTRATION_SUCCESS_EMAIL_TEMPLATE,
      );
      setRegistrationSuccessEmailSubject(
        data?.registration_success_email_subject ?? "Registration Confirmed",
      );
      setUseSubmissionEmailTemplate(
        data?.use_submission_email_template ?? false,
      );
      setUseSuccessEmailTemplate(data?.use_success_email_template ?? false);
      setNotifyOnMemberRegistration(
        data?.notify_on_member_registration ?? true,
      );
      setClubVariables(data?.club_variables || []);
      setIsInitialized(true);
    }
  }, [data, isInitialized]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
        opening_times: openingTimes,
        club_account_id: club?.club_account_id as string,
        bank_details: bankingData.bank_details,
        country_of_operation: country,
        currency,
        support_email: supportEmail,
        club_url: clubUrl,
        about_club: clubDetails,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        hide_from_public: hideFromPublic,
        registration_submission_email_template_body:
          registrationSubmissionEmailTemplate,
        registration_submission_email_subject:
          registrationSubmissionEmailSubject,
        registration_success_email_template_body:
          registrationSuccessEmailTemplate,
        registration_success_email_subject: registrationSuccessEmailSubject,
        use_success_email_template: useSuccessEmailTemplate,
        use_submission_email_template: useSubmissionEmailTemplate,
        notify_on_member_registration: notifyOnMemberRegistration,
        club_variables: clubVariables.map(toClubVariableRequest),
      },
      {
        onSuccess: () => {
          if (club) {
            const isBankingDetailsComplete =
              bankingData.bank_details.bank &&
              bankingData.bank_details.account_number &&
              bankingData.bank_details.branch_code &&
              bankingData.bank_details.account_type;
            setClub({
              ...club,
              currency_exists: Boolean(currency),
              country_exists: Boolean(country),
              bank_details_exists: Boolean(isBankingDetailsComplete),
            });
          }
          toast.success("Successfully updated club details");
        },
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
      },
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
        opening_times: openingTimes,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        country_of_operation: country,
        currency,
        support_email: supportEmail,
        club_url: clubUrl,
        about_club: clubDetails,
        hide_from_public: hideFromPublic,
        registration_submission_email_template_body:
          registrationSubmissionEmailTemplate,
        registration_submission_email_subject:
          registrationSubmissionEmailSubject,
        registration_success_email_template_body:
          registrationSuccessEmailTemplate,
        registration_success_email_subject: registrationSuccessEmailSubject,
        use_success_email_template: useSuccessEmailTemplate,
        use_submission_email_template: useSubmissionEmailTemplate,
        notify_on_member_registration: notifyOnMemberRegistration,
        club_variables: clubVariables.map(toClubVariableRequest),
      },
      {
        onSuccess: () => {
          if (club) {
            const isBankingDetailsComplete =
              data?.bank_details?.bank &&
              data?.bank_details?.account_number &&
              data?.bank_details?.branch_code &&
              data?.bank_details?.account_type;
            setClub({
              ...club,
              currency_exists: Boolean(currency),
              country_exists: Boolean(country),
              bank_details_exists: Boolean(isBankingDetailsComplete),
            });
          }
          toast.success("Successfully updated club details");
        },
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
      },
    );

  const updateEmailSettings = (emailData: {
    club_account_id: string;
    registration_submission_email_subject: string;
    registration_submission_email_template_body: string;
    registration_success_email_subject: string;
    registration_success_email_template_body: string;
    support_email: string;
    use_submission_email_template: boolean;
    use_success_email_template: boolean;
    notify_on_member_registration: boolean;
  }) =>
    mutate(emailData, {
      onSuccess: () => {
        toast.success("Successfully updated email settings");
      },
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
    });

  if (isLoading) {
    return (
      <div className="p-5 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  function handleTimeChange(
    idx: number,
    field: "open" | "close",
    value: string,
  ) {
    setOpeningTimes((times) =>
      times.map((t, i) =>
        i === idx ? { ...t, [field]: value, closed: false } : t,
      ),
    );
  }

  function handleClosedChange(idx: number, checked: boolean) {
    setOpeningTimes((times) =>
      times.map((t, i) =>
        i === idx ? { ...t, closed: checked, open: "", close: "" } : t,
      ),
    );
  }

  function isBankingDetailsIncomplete(): boolean {
    // If the form is currently complete, return false (no star needed)
    if (isBankingDetailsFormComplete) return false;

    // Otherwise check if saved data is complete
    const bankDetails = data?.bank_details;
    if (!bankDetails) return true;
    return !(
      bankDetails.bank &&
      bankDetails.account_number &&
      bankDetails.branch_code &&
      bankDetails.account_type
    );
  }

  function isLocationIncomplete(): boolean {
    return !country || !currency;
  }

  return (
    <div className="space-y-6">
      <div className="flex w-full flex-col">
        {!isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-12">
              <TabsTrigger value="club-view">Club View</TabsTrigger>
              <TabsTrigger value="account">
                Banking & Payments
                {isBankingDetailsIncomplete() && (
                  <span className="ml-2 text-red-500 font-bold text-2xl leading-none">
                    *
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="location">
                Club Configuration
                {isLocationIncomplete() && (
                  <span className="ml-2 text-red-500 font-bold text-2xl leading-none">
                    *
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="emailing">Emailing</TabsTrigger>
            </TabsList>

            {/* Club View Tab */}
            <TabsContent value="club-view">
              <Card className="border-0 shadow-none">
                <CardHeader className="sticky top-0 p-6 bg-white flex flex-row items-start justify-between space-y-0">
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
                <CardContent className="space-y-12">
                  {/* Public Listing Section - Full Width Row */}
                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Public Listing
                    </h3>
                    <Card className="rounded-2xl">
                      <CardContent className="p-5 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Control whether this club appears in the public Browse
                          Clubs list.
                        </p>
                        <div className="flex items-center gap-6">
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
                      </CardContent>
                    </Card>
                  </section>

                  {/* Social Links Section - Full Width Row */}
                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Social Links (optional)
                    </h3>
                    <Card className="rounded-2xl">
                      <CardContent className="space-y-4 p-5">
                        <div>
                          <Label
                            htmlFor="club_url"
                            className="text-sm mb-2 block"
                          >
                            Website Link
                          </Label>
                          <Input
                            id="club_url"
                            type="url"
                            placeholder="https://yourwebsite.com"
                            value={clubUrl}
                            onChange={(e) => setClubUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="instagram_url"
                            className="text-sm mb-2 block"
                          >
                            Instagram Link
                          </Label>
                          <Input
                            id="instagram_url"
                            type="url"
                            placeholder="https://instagram.com/yourclub"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="facebook_url"
                            className="text-sm mb-2 block"
                          >
                            Facebook Link
                          </Label>
                          <Input
                            id="facebook_url"
                            type="url"
                            placeholder="https://facebook.com/yourclub"
                            value={facebookUrl}
                            onChange={(e) => setFacebookUrl(e.target.value)}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          If provided, these URLs may be used on the public club
                          page for linking to your social media profiles.
                        </p>
                      </CardContent>
                    </Card>
                  </section>

                  {/* Other Configurations Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 auto-rows-max">
                    {/* Opening Times Section */}
                    <section className="h-full flex flex-col col-span-2">
                      <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Opening Times
                      </h3>
                      <Card className="rounded-2xl flex-1 flex flex-col">
                        <CardContent className="px-5 flex-1 flex flex-col">
                          <p className="text-xs mb-10 text-muted-foreground mt-4">
                            Set your club's opening and closing times for each
                            day. Mark as closed if not open that day.
                          </p>
                          <div className="grid gap-3 flex-1">
                            {openingTimes.map((t, idx) => (
                              <div
                                key={t.day}
                                className="flex items-center gap-3"
                              >
                                <span className="w-24 text-sm font-medium">
                                  {t.day}
                                </span>
                                <Input
                                  type="time"
                                  value={t.open}
                                  disabled={t.closed}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      idx,
                                      "open",
                                      e.target.value,
                                    )
                                  }
                                  className="w-28"
                                  aria-label={`${t.day} opening time`}
                                />
                                <span className="text-muted-foreground">–</span>
                                <Input
                                  type="time"
                                  value={t.close}
                                  disabled={t.closed}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      idx,
                                      "close",
                                      e.target.value,
                                    )
                                  }
                                  className="w-28"
                                  aria-label={`${t.day} closing time`}
                                />
                                <label className="flex items-center gap-2 ml-2 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={t.closed}
                                    onChange={(e) =>
                                      handleClosedChange(idx, e.target.checked)
                                    }
                                    className="accent-primary"
                                  />
                                  <span>Closed</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </section>

                    {/* Club Description Section */}
                    <section className="h-full flex flex-col">
                      <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Club Description
                      </h3>
                      <Card className="rounded-2xl flex-1 flex flex-col">
                        <CardContent className="px-5 flex-1 flex flex-col">
                          <p className="text-xs mb-5 mt-4 text-muted-foreground">
                            Provide a detailed description about your club to
                            help members and visitors understand what your club
                            is about.
                          </p>
                          <div className="flex-1 flex flex-col">
                            <Textarea
                              id="about_club"
                              placeholder="Information about the club"
                              value={clubDetails}
                              onChange={(e) => setClubDetails(e.target.value)}
                              className="min-h-32 flex-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </section>
                  </div>

                  {/* Gallery Section - Full Width */}
                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Gallery
                    </h3>
                    <ClubGalleryEdit
                      clubId={club?.club_account_id as string}
                      galleryImages={
                        data?.gallery_images
                          ? data.gallery_images.map((image: any) => ({
                              id: image.key,
                              url: image.url,
                            }))
                          : []
                      }
                    />
                  </section>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <BankingDetailsForm
                club_account_id={club?.club_account_id as string}
                bankDetails={data?.bank_details}
                payfastDetails={data?.payfast_details}
                autoRegisterMembersIfPaid={
                  data?.auto_register_members_if_paid ?? false
                }
                payfastEnabled={data?.payfast_enabled}
                customPaymentMethods={data?.custom_payment_methods}
                onSave={handleBankingDetailsSave}
                isPending={isPending}
                onCompletionChange={setIsBankingDetailsFormComplete}
              />
            </TabsContent>


            <TabsContent value="location">
              <Card className="border-0 shadow-none">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle>Club Configuration</CardTitle>
                    <CardDescription>
                      Set the configuration settings for your club.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      const filteredVariables = clubVariables.filter(v => v.name.trim());

                      const visitedNames = new Set<string>();
                      for (const variable of filteredVariables) {
                        const lowerName = variable.name.trim().toLowerCase();
                        if (visitedNames.has(lowerName)) {
                          toast.error(`Duplicate variable name: "${variable.name}"`);
                          return;
                        }
                        visitedNames.add(lowerName);
                      }

                      const visitedKeys = new Set<string>();
                      for (const variable of filteredVariables) {
                        const lowerKey = variable.key.trim().toLowerCase();
                        if (visitedKeys.has(lowerKey)) {
                          toast.error(`Duplicate variable key: "${variable.key}"`);
                          return;
                        }
                        visitedKeys.add(lowerKey);
                      }

                      mutate(
                        {
                          club_account_id: club?.club_account_id as string,
                          country_of_operation: country,
                          currency,
                          club_variables: filteredVariables.map(toClubVariableRequest),
                        },
                        {
                          onSuccess: () => {
                            toast.success("Successfully updated club configuration");
                          },
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
                    }}
                  >
                    {isPending ? (
                      <p className="flex space-x-2 items-center">
                        <Loader2 className="animate-spin" />
                        <span>Saving...</span>
                      </p>
                    ) : (
                      "Save Configuration"
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Location Section */}
                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Location & Currency
                    </h3>
                    <div className="grid gap-6">
                      <div className="grid gap-2">
                        <Label>
                          Country of Operation
                          {!country && (
                            <span className="text-red-500 font-bold text-lg ml-2">*</span>
                          )}
                        </Label>
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
                        <Label>
                          Currency
                          {!currency && (
                            <span className="text-red-500 font-bold text-lg ml-2">*</span>
                          )}
                        </Label>
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
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-10">
                      Tags
                    </h3>
                    <ClubVariablesForm
                      variables={clubVariables}
                      onSave={setClubVariables}
                      onChange={setClubVariables}
                      registrationDropdownFields={registrationDropdownFields}
                      showSaveButton={false}
                      isPending={isPending}
                    />
                  </section>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emailing">
              <EmailSettingsForm
                supportEmail={supportEmail}
                setSupportEmail={setSupportEmail}
                notifyOnMemberRegistration={notifyOnMemberRegistration}
                setNotifyOnMemberRegistration={setNotifyOnMemberRegistration}
                registrationSubmissionEmailTemplate={
                  registrationSubmissionEmailTemplate
                }
                setRegistrationSubmissionEmailTemplate={
                  setRegistrationSubmissionEmailTemplate
                }
                registrationSubmissionEmailSubject={
                  registrationSubmissionEmailSubject
                }
                setRegistrationSubmissionEmailSubject={
                  setRegistrationSubmissionEmailSubject
                }
                useSubmissionEmailTemplate={useSubmissionEmailTemplate}
                setUseSubmissionEmailTemplate={setUseSubmissionEmailTemplate}
                registrationSuccessEmailTemplate={
                  registrationSuccessEmailTemplate
                }
                setRegistrationSuccessEmailTemplate={
                  setRegistrationSuccessEmailTemplate
                }
                registrationSuccessEmailSubject={registrationSuccessEmailSubject}
                setRegistrationSuccessEmailSubject={
                  setRegistrationSuccessEmailSubject
                }
                useSuccessEmailTemplate={useSuccessEmailTemplate}
                setUseSuccessEmailTemplate={setUseSuccessEmailTemplate}
                clubName={club?.club_name ?? ""}
                clubVariables={clubVariables}
                onSave={updateEmailSettings}
                isPending={isPending}
                clubAccountId={club?.club_account_id ?? ""}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
