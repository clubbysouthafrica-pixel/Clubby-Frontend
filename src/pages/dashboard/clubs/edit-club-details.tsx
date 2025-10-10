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

    useEffect(() => {
        if (data) {
            setBank(data.bank_details?.bank)
            setBranchCode(data.bank_details?.branch_code)
            setBankAccountNumber(data.bank_details?.account_number)
            setAccountType(data.bank_details?.account_type)
            setCurrency(data?.currency)
            setCountry(data?.country_of_operation)
            setSupportEmail(data.support_email)
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
        support_email: supportEmail
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
            <div className="flex w-full max-w-sm flex-col gap-6">
                {
                    !isLoading &&
                    <Tabs defaultValue="account">
                        <TabsList>
                            <TabsTrigger className="w-[150px]" value="account">Banking Details</TabsTrigger>
                            <TabsTrigger className="w-[150px]" value="password">Location</TabsTrigger>
                            <TabsTrigger className="w-[150px]" value="emailing">Emailing</TabsTrigger>
                        </TabsList>
                        <TabsContent value="account">
                            <Card>
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
                                <CardFooter>
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Location</CardTitle>
                                    <CardDescription>
                                        Set the country the club is operating out of, save after update.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="tabs-demo-new">Country</Label>
                                        <Select onValueChange={(v) => setCountry(v)} defaultValue={country}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Select a country</SelectLabel>
                                                    {countries.map(country => {
                                                        return <SelectItem key={country.code} value={country.code}>{country.name} ({country.code})</SelectItem>
                                                    })}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="tabs-demo-new">Currency</Label>
                                        <Select onValueChange={(v) => setCurrency(v)} defaultValue={currency}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Select a currency</SelectLabel>
                                                    {currencies.map(currency => {
                                                        return <SelectItem key={currency.code} value={currency.code}>{currency.name} ({currency.code})</SelectItem>
                                                    })}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                                <CardFooter className="content-right">
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Email</CardTitle>
                                    <CardDescription>
                                        Set the support email that members can contact you on.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="tabs-demo-name">Support Email</Label>
                                        <Input
                                            id="tabs-demo-name"
                                            type="text"
                                            value={supportEmail}
                                            onChange={(e) => setSupportEmail(e.target.value)}
                                            placeholder="Set support email"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="content-right">
                                    <Button onClick={update} disabled={isPending}>{
                                        isPending ? (
                                            <p className="flex space-x-2 items-center">
                                                <Loader2 className="animate-spin" />
                                                <span>Saving...</span>
                                            </p>
                                        ) : "Save"
                                    }</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                }
            </div>
        </div>
    )
}