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


export default function EditClubDetails() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data, isLoading } = useFetchClubDetails(club?.club_account_id as string)
    const { mutate, isPending } = useUpdateClubDetailsMutation()

    const [country, setCountry] = useState('')
    const [currency, setCurrency] = useState('')
    const [bank, setBank] = useState('')
    const [bankAccountNumber, setBankAccountNumber] = useState('')
    const [branchCode, setBranchCode] = useState('')
    const [accountType, setAccountType] = useState('')
    const [supportEmail, setSupportEmail] = useState('')

    const [registrationSubmissionEmailTemplate, setRegistrationSubmissionEmailTemplate] = useState<string>(REGISTRATION_SUBMISSION_EMAIL_TEMPLATE)
    const [registrationSuccessEmailTemplate, setRegistrationSuccessEmailTemplate] = useState<string>(REGISTRATION_SUCCESS_EMAIL_TEMPLATE)
    const [useSuccessEmailTemplate, setUseSuccessEmailTemplate] = useState<boolean>(false)
    const [useSubmissionEmailTemplate, setUseSubmissionEmailTemplate] = useState<boolean>(false)

    useEffect(() => {
        if (data) {
            setBank(data.bank_details?.bank)
            setBranchCode(data.bank_details?.branch_code)
            setBankAccountNumber(data.bank_details?.account_number)
            setAccountType(data.bank_details?.account_type)
            setCurrency(data?.currency)
            setCountry(data?.country_of_operation)
            setSupportEmail(data.support_email)

            setRegistrationSubmissionEmailTemplate(data?.registration_submission_email_template_body ?? REGISTRATION_SUBMISSION_EMAIL_TEMPLATE)
            setRegistrationSuccessEmailTemplate(data?.registration_success_email_template_body ?? REGISTRATION_SUCCESS_EMAIL_TEMPLATE)
            setUseSubmissionEmailTemplate(data?.use_submission_email_template ?? false)
            setUseSuccessEmailTemplate(data?.use_success_email_template ?? false)
        }
    }, [data])

    const update = () => mutate({
        club_account_id: club?.club_account_id as string,
        bank_details: {
            bank,
            account_number: bankAccountNumber,
            branch_code: branchCode,
            account_type: accountType
        },
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
        <div className="space-y-6 min-h-screen">
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
                            <Card className="h-[630px]">
                                <CardHeader>
                                    <CardTitle>Banking Details</CardTitle>
                                    <CardDescription>
                                        Make changes to your account here. Click save when you&apos;re
                                        done.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="tabs-demo-name">Bank</Label>
                                        <Input
                                            id="tabs-demo-name"
                                            type="text"
                                            value={bank}
                                            onChange={(e) => setBank(e.target.value)}
                                            placeholder="Set bank"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="tabs-demo-name">Account Number</Label>
                                        <Input
                                            id="tabs-demo-name"
                                            type="text"
                                            value={bankAccountNumber}
                                            onChange={(e) => setBankAccountNumber(e.target.value)}
                                            placeholder="Set bank account number"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="tabs-demo-name">Branch Code</Label>
                                        <Input
                                            id="tabs-demo-name"
                                            type="text"
                                            value={branchCode}
                                            onChange={(e) => setBranchCode(e.target.value)}
                                            placeholder="Set bank branch code"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="tabs-demo-name">Account Type</Label>
                                        <Input
                                            id="tabs-demo-name"
                                            type="text"
                                            value={accountType}
                                            onChange={(e) => setAccountType(e.target.value)}
                                            placeholder="Set bank account type"
                                        />
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
                                    <TabsList className="flex justify-between h-[25px]">
                                        <TabsTrigger className=" w-[200px] text-xs h-[20px]" value="support-email">Support Email</TabsTrigger>
                                        <TabsTrigger className="w-[200px] text-xs h-[20px]" value="registration-submission">Registration Submission</TabsTrigger>
                                        <TabsTrigger className="w-[200px] text-xs h-[20px]" value="registration-success">Registration Success</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="support-email" className="flex flex-col py-2 gap-2">
                                        <CardTitle>Support Email</CardTitle>
                                        <CardDescription>
                                            Set the support email that members can contact you on.
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
                                            This is an editable draft of the email sent to a member when they submit their member registration. To place where the members name should be use, <strong>{"{{member_name}}"}</strong>.
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
                                            This is an editable draft of the email sent to a member when they are successfully registered by the admin. To place where the members name should be use, <strong>{"{{member_name}}"}</strong>.
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