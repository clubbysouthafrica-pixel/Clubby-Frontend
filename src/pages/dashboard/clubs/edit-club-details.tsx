import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { countries } from "@/data/countries";
import { currencies } from "@/data/currencies";
import { useUpdateClubDetailsMutation } from "@/mutations/admin/club";
import { useFetchClubDetails } from "@/queries/admin/clubs";
import { Loader2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { REGISTRATION_SUBMISSION_EMAIL_TEMPLATE, REGISTRATION_SUCCESS_EMAIL_TEMPLATE } from "@/helpers/admin/constants/registration_submission_email_template";
import EditableEmailTemplate from "../../../components/admin/manage/emailing/editable_email_template"
import { BankingDetailsForm } from "@/components/admin/club/banking-details-form"


export default function EditClubDetails() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data, isLoading } = useFetchClubDetails(club?.club_account_id as string)
    const { mutate, isPending } = useUpdateClubDetailsMutation()

    const [country, setCountry] = useState('')
    const [currency, setCurrency] = useState('')
    const [supportEmail, setSupportEmail] = useState('')

    const [registrationSubmissionEmailTemplate, setRegistrationSubmissionEmailTemplate] = useState<string>(REGISTRATION_SUBMISSION_EMAIL_TEMPLATE)
    const [registrationSuccessEmailTemplate, setRegistrationSuccessEmailTemplate] = useState<string>(REGISTRATION_SUCCESS_EMAIL_TEMPLATE)
    const [useSuccessEmailTemplate, setUseSuccessEmailTemplate] = useState<boolean>(false)
    const [useSubmissionEmailTemplate, setUseSubmissionEmailTemplate] = useState<boolean>(false)

    useEffect(() => {
        if (data) {
            setCurrency(data?.currency)
            setCountry(data?.country_of_operation)
            setSupportEmail(data.support_email)

            setRegistrationSubmissionEmailTemplate(data?.registration_submission_email_template_body ?? REGISTRATION_SUBMISSION_EMAIL_TEMPLATE)
            setRegistrationSuccessEmailTemplate(data?.registration_success_email_template_body ?? REGISTRATION_SUCCESS_EMAIL_TEMPLATE)
            setUseSubmissionEmailTemplate(data?.use_submission_email_template ?? false)
            setUseSuccessEmailTemplate(data?.use_success_email_template ?? false)
        }
    }, [data])

    const handleBankingDetailsSave = (bankingData: {
        bank_details: {
            bank: string
            account_number: string
            branch_code: string
            account_type: string
        }
    }) => {
        mutate({
            club_account_id: club?.club_account_id as string,
            bank_details: bankingData.bank_details,
            country_of_operation: country,
            currency,
            support_email: supportEmail,
            registration_submission_email_template_body: registrationSubmissionEmailTemplate,
            registration_success_email_template_body: registrationSuccessEmailTemplate,
            use_success_email_template: useSuccessEmailTemplate,
            use_submission_email_template: useSubmissionEmailTemplate
        }, {
            onSuccess: () => toast.success("Successfully updated club details"),
            onError: () => toast.error("Something went wrong")
        })
    }

    const update = () => mutate({
        club_account_id: club?.club_account_id as string,
        bank_details: data?.bank_details || { bank: '', account_number: '', branch_code: '', account_type: '' },
        payfast_details: data?.payfast_details || { merchant_id: '', merchant_key: '', passphrase: '' },
        country_of_operation: country,
        currency,
        support_email: supportEmail,
        registration_submission_email_template_body: registrationSubmissionEmailTemplate,
        registration_success_email_template_body: registrationSuccessEmailTemplate,
        use_success_email_template: useSuccessEmailTemplate,
        use_submission_email_template: useSubmissionEmailTemplate
    }, {
        onSuccess: () => toast.success("Successfully updated club details"),
        onError: () => toast.error("Something went wrong")
    })

    if (isLoading) {
        return (
            <div className="p-5 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }
    return (
        <div className="space-y-6">
            <div className="flex w-[700px] flex-col gap-6">
                {
                    !isLoading &&
                    <Tabs defaultValue="account">
                        <TabsList>
                            <TabsTrigger className="w-[150px]" value="account">Banking Details</TabsTrigger>
                            <TabsTrigger className="w-[150px]" value="password">Location</TabsTrigger>
                            <TabsTrigger className="w-[150px]" value="emailing">Emailing</TabsTrigger>
                        </TabsList>
                        <TabsContent value="account">
                            <BankingDetailsForm 
                                club_account_id={club?.club_account_id as string}
                                bankDetails={data?.bank_details}
                                payfastEnabled={data?.payfast_enabled}
                                onSave={handleBankingDetailsSave}
                                isPending={isPending}
                            />
                        </TabsContent>
                        <TabsContent value="password">
                            <Card className="h-[630px]">
                                <CardHeader>
                                    <CardTitle>Location</CardTitle>
                                    <CardDescription>
                                        Set the country the club is operating out of, save after update.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="grid gap-3 w-full">
                                        <Label htmlFor="country">Country</Label>
                                        <Select onValueChange={(v) => setCountry(v)} defaultValue={country}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent className="w-full">
                                                <SelectGroup>
                                                    <SelectLabel>Select a country</SelectLabel>
                                                    {countries.map((country) => (
                                                        <SelectItem key={country.code} value={country.code}>
                                                            {country.name} ({country.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-3 w-full">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select onValueChange={(v) => setCurrency(v)} defaultValue={currency}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent className="w-full">
                                                <SelectGroup>
                                                    <SelectLabel>Select a currency</SelectLabel>
                                                    {currencies.map((currency) => (
                                                        <SelectItem key={currency.code} value={currency.code}>
                                                            {currency.name} ({currency.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>

                                <CardFooter className="flex justify-start mt-auto">
                                    <Button onClick={update} disabled={isPending}>{
                                        isPending ? (
                                            <p className="flex space-x-2 items-center">
                                                <Loader2 className="animate-spin" />
                                                <span>Saving</span>
                                            </p>
                                        ) : "Save"
                                    }</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                        <TabsContent value="emailing">
                            <Card className="flex flex-col h-[630px]">
                                <Tabs defaultValue="support-email" className="px-5">
                                    <TabsList className="flex justify-between h-[30px]">
                                        <TabsTrigger className=" w-[200px] text-xs h-[25px]" value="support-email">Support Email</TabsTrigger>
                                        <TabsTrigger className="w-[200px] text-xs h-[25px]" value="registration-submission">Registration Submission</TabsTrigger>
                                        <TabsTrigger className="w-[200px] text-xs h-[25px]" value="registration-success">Registration Success</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="support-email" className="flex flex-col py-2 gap-2">
                                        <CardTitle>Support Email</CardTitle>
                                        <CardDescription>
                                            Set the support email members can contact. This mailbox will also receive a notification each time a member submits a registration form.
                                        </CardDescription>
                                        <Input
                                            id="tabs-demo-name"
                                            type="text"
                                            value={supportEmail}
                                            onChange={(e) => setSupportEmail(e.target.value)}
                                            placeholder="Set support email"
                                        />
                                    </TabsContent>

                                    <TabsContent value="registration-submission" className="flex flex-col py-2 gap-2">
                                        <CardTitle>Registration Submission Email</CardTitle>
                                        <CardDescription>
                                            This is an editable draft of the email sent to a member when they submit their registration. To insert the member’s name, use <strong>{"{{member_name}}"}</strong>.
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

                                    <TabsContent value="registration-success" className="flex flex-col py-2 gap-2">
                                        <CardTitle>Registration Success Email</CardTitle>
                                        <CardDescription>
                                            This is an editable draft of the email sent to a member upon successful registration by the admin. To insert the member’s name, use <strong>{"{{member_name}}"}</strong>.
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

                                <CardFooter className="flex justify-start mt-auto">
                                    <Button onClick={update} disabled={isPending}>
                                        {isPending ? (
                                            <p className="flex space-x-2 items-center">
                                                <Loader2 className="animate-spin" />
                                                <span>Saving...</span>
                                            </p>
                                        ) : (
                                            "Save"
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>

                        </TabsContent>
                    </Tabs>
                }
            </div>
        </div>
    )
}