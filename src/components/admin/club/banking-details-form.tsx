import { useState, useEffect, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter as UIDialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useResetPayFastDetailsMutation, useUpdatePayFastDetailsMutation } from '@/mutations/admin/payfast'
import { useQueryClient } from '@tanstack/react-query'
import { ClubContext, ClubContextType } from '@/context/ClubContext'

interface BankDetails {
    bank?: string
    account_number?: string
    branch_code?: string
    account_type?: string
}

interface BankingDetailsFormProps {
    club_account_id?: string
    bankDetails?: BankDetails
    payfastEnabled?: boolean
    onSave: (data: {
        bank_details: Required<BankDetails>
    }) => void
    isPending?: boolean
}

export function BankingDetailsForm({ 
    club_account_id,
    bankDetails,
    payfastEnabled = false,
    onSave, 
    isPending = false 
}: BankingDetailsFormProps) {
    const { club } = useContext(ClubContext) as ClubContextType
    const clubAccountId = (club_account_id ?? club?.club_account_id) as string
    const queryClient = useQueryClient()

    const { mutate: mutateUpdatePayFast, isPending: updatePayFastLoading } = useUpdatePayFastDetailsMutation()
    const { mutate: mutateResetPayFast, isPending: resetPayFastLoading } = useResetPayFastDetailsMutation()

    const [bank, setBank] = useState('')
    const [bankAccountNumber, setBankAccountNumber] = useState('')
    const [branchCode, setBranchCode] = useState('')
    const [accountType, setAccountType] = useState('')

    const [payfastMerchantId, setPayfastMerchantId] = useState('')
    const [payfastMerchantKey, setPayfastMerchantKey] = useState('')
    const [payfastPassphrase, setPayfastPassphrase] = useState('')
    const [activeTab, setActiveTab] = useState<'eft' | 'payfast'>('eft')
    const [resetDialogOpen, setResetDialogOpen] = useState(false)

    useEffect(() => {
        if (bankDetails) {
            setBank(bankDetails.bank || '')
            setBankAccountNumber(bankDetails.account_number || '')
            setBranchCode(bankDetails.branch_code || '')
            setAccountType(bankDetails.account_type || '')
        }
    }, [bankDetails])

    const getApiErrorMessage = (err: unknown): string => {
        type ErrorPayload = { message?: string; error?: string } | string | undefined
        const e = err as { response?: { data?: ErrorPayload }; message?: string }
        const data = e?.response?.data
        let msg: string | undefined
        if (typeof data === 'string') {
            msg = data
        } else if (data && typeof data === 'object') {
            const obj = data as { message?: string; error?: string }
            msg = obj.message ?? obj.error
        }
        return msg ?? e?.message ?? 'An unexpected error occurred'
    }

    const handleSavePayFast = async () => {
        mutateUpdatePayFast({
            club_account_id: clubAccountId,
            merchant_id: payfastMerchantId,
            merchant_key: payfastMerchantKey,
            passphrase: payfastPassphrase
        }, {
            onSuccess: async () => {
                toast.success("PayFast merchant is connected.")
                await queryClient.invalidateQueries({ queryKey: ['getClubDetails', clubAccountId] })
            },
            onError: (error) => toast.error(getApiErrorMessage(error))
        })
    }

    const handleResetPayFast = async () => {
        mutateResetPayFast({
            club_account_id: clubAccountId
        }, {
            onSuccess: async () => {
                toast.success("PayFast details reset.")
                await queryClient.invalidateQueries({ queryKey: ['getClubDetails', clubAccountId] })
                setResetDialogOpen(false)
            },
            onError: (error) => toast.error(getApiErrorMessage(error))
        })
    }

    const handleSave = () => {
        onSave({
            bank_details: {
                bank,
                account_number: bankAccountNumber,
                branch_code: branchCode,
                account_type: accountType
            }
        })
    }

    return (
        <Card className="h-[630px] border-0 shadow-none">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                    <CardTitle>Banking Details</CardTitle>
                    <CardDescription>
                        Configure your payment methods. Click save when you&apos;re done.
                    </CardDescription>
                </div>
                {activeTab === 'eft' && (
                    <Button onClick={handleSave} disabled={isPending} variant="outline">
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save banking details'
                        )}
                    </Button>
                )}
                {activeTab === 'payfast' && (
                    payfastEnabled ? (
                        <>
                            <Button type="button" variant="outline" onClick={() => setResetDialogOpen(true)} disabled={resetPayFastLoading}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Reset PayFast
                            </Button>
                            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reset PayFast details?</DialogTitle>
                                        <DialogDescription>
                                            This will remove your saved PayFast credentials and disconnect PayFast from your club. You can reconfigure at any time.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <UIDialogFooter>
                                        <Button variant="outline" type="button" onClick={() => setResetDialogOpen(false)} disabled={resetPayFastLoading}>
                                            Cancel
                                        </Button>
                                        <Button variant="destructive" type="button" onClick={handleResetPayFast} disabled={resetPayFastLoading}>
                                            {resetPayFastLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Resetting...
                                                </>
                                            ) : (
                                                'Confirm reset'
                                            )}
                                        </Button>
                                    </UIDialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : (
                        <Button type="button" variant="outline" onClick={handleSavePayFast} disabled={updatePayFastLoading}>
                            {updatePayFastLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save PayFast details'
                            )}
                        </Button>
                    )
                )}
            </CardHeader>
            <CardContent className="grid gap-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'eft' | 'payfast')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="eft">EFT</TabsTrigger>
                        <TabsTrigger value="payfast">PayFast</TabsTrigger>
                    </TabsList>
                    {activeTab === 'eft' && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            Electronic Funds Transfer (EFT) allows members to pay directly into your club's bank account.
                            These details will be displayed to members for manual transfers.
                        </p>
                    )}
                    {activeTab === 'payfast' && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            PayFast is a South African payment gateway that enables secure online payments
                            (card, Instant EFT, more). Connect your merchant to accept online payments for your club.{' '}
                            <a href="https://www.payfast.io" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                                Create a merchant account
                            </a>.
                        </p>
                    )}
                    <TabsContent value="eft" className="space-y-4 mt-4">
                        <div className="grid gap-3">
                            <Label htmlFor="bank">Bank</Label>
                            <Input
                                id="bank"
                                type="text"
                                value={bank}
                                onChange={(e) => setBank(e.target.value)}
                                placeholder="Set bank"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="account-number">Account Number</Label>
                            <Input
                                id="account-number"
                                type="text"
                                value={bankAccountNumber}
                                onChange={(e) => setBankAccountNumber(e.target.value)}
                                placeholder="Set bank account number"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="branch-code">Branch Code</Label>
                            <Input
                                id="branch-code"
                                type="text"
                                value={branchCode}
                                onChange={(e) => setBranchCode(e.target.value)}
                                placeholder="Set bank branch code"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="account-type">Account Type</Label>
                            <Input
                                id="account-type"
                                type="text"
                                value={accountType}
                                onChange={(e) => setAccountType(e.target.value)}
                                placeholder="Set bank account type"
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="payfast" className="space-y-4 mt-4">
                        {payfastEnabled ? (
                            <div className="space-y-4">
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertTitle>PayFast setup complete</AlertTitle>
                                    <AlertDescription>
                                        Your PayFast merchant is connected. You can reset to reconfigure at any time.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="merchant-id">Merchant ID</Label>
                                    <Input
                                        id="merchant-id"
                                        type="text"
                                        value={payfastMerchantId}
                                        onChange={(e) => setPayfastMerchantId(e.target.value)}
                                        placeholder="Enter PayFast merchant ID"
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="merchant-key">Merchant Key</Label>
                                    <Input
                                        id="merchant-key"
                                        type="text"
                                        value={payfastMerchantKey}
                                        onChange={(e) => setPayfastMerchantKey(e.target.value)}
                                        placeholder="Enter PayFast merchant key"
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="passphrase">Passphrase (Optional)</Label>
                                    <Input
                                        id="passphrase"
                                        type="text"
                                        value={payfastPassphrase}
                                        onChange={(e) => setPayfastPassphrase(e.target.value)}
                                        placeholder="Enter PayFast passphrase"
                                    />
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
