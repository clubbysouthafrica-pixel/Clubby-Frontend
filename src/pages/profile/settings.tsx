import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
    Bell,
    Globe,
    User,
} from "lucide-react";
import Pager from "@/components/pager";
import { useContext, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfileMutation } from "@/mutations/profile";
import { useGetProfileQuery } from "@/queries/profile";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { toast } from "sonner";

const SettingRow = ({
    icon,
    title,
    description,
    children,
    setWidthFlex
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
    setWidthFlex?: boolean
}) => (
    <div className="flex items-start justify-between py-4">
        <div className="flex gap-4">
            <div className="mt-1 text-muted-foreground">
                {icon}
            </div>
            <div>
                <h3 className="font-medium leading-none mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
        <div className={setWidthFlex ? "flex-1 ml-6" : "flex-init"}>{children}</div>
    </div>
);

export default function SettingsPage() {
    const { isAdmin } = useContext(AuthContext) as AuthContextType
    const { mutate, isPending } = useUpdateProfileMutation(isAdmin)
    const { data } = useGetProfileQuery(isAdmin)
    const [accountSettings, setAccountSettings] = useState({
        first_name: "",
        surname: "",
        date_of_birth: "",
        phone_number: "",
        address_line_1: "",
        address_line_2: "",
        suburb: "",
        postal_code: "",
        city: "",
        country: ""
    })

    useEffect(() => {
        if (data) {
            setAccountSettings({
                first_name: data.first_name,
                surname: data.surname,
                date_of_birth: data.date_of_birth,
                phone_number: data.phone_number,
                address_line_1: data.address_line_1,
                address_line_2: data.address_line_2,
                suburb: data.suburb,
                postal_code: data.postal_code,
                city: data.city,
                country: data.country
            })
        }
    }, [data])

    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        marketing: false
    });

    const saveProfileSettings = () => mutate(accountSettings, {
        onSuccess: () => toast.success("Successfully saved user details."),
        onError: () => toast.error("Something went wrong.")
    })

    return (
        <Pager>
            <div className="container max-w-4xl mx-auto px-4 py-16">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-base font-bold">Settings</h1>
                        <p className="text-muted-foreground">
                            Manage your account preferences and settings
                        </p>
                    </div>
                    <Button onClick={saveProfileSettings}>{isPending ? "Saving Changes..." : "Save changes"}</Button>
                </div>

                <Tabs defaultValue="account">
                    <TabsList>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        {/* <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
                        {/* <TabsTrigger value="security">Security</TabsTrigger> */}
                        {/* <TabsTrigger value="appearance">Appearance</TabsTrigger> */}
                    </TabsList>

                    <TabsContent value="account">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="sticky top-16 rounded-lg bg-white dark:bg-gray-800 w-full">
                                    <SettingRow
                                        icon={<User className="h-5 w-5" />}
                                        title="Profile Information"
                                        description="Update your personal information and email address"
                                    >
                                        <Button variant="outline" size="sm" disabled={isPending} onClick={saveProfileSettings}>
                                            {isPending ? "Updating..." : "Update"}
                                        </Button>
                                    </SettingRow>
                                </div>
                                <Separator />
                                <SettingRow
                                    icon={<Globe className="h-5 w-5" />}
                                    title="Account Details"
                                    description="Enter your basic account details"
                                    setWidthFlex={true}
                                >
                                    <div className="space-y-4">
                                        <div className="w-full space-y-2">
                                            <Label>
                                                First Name
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your name"
                                                value={accountSettings.first_name}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, first_name: v.target.value }))}
                                            />
                                        </div>
                                        <div className="w-full space-y-2">
                                            <Label>
                                                Surname
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your surname"
                                                value={accountSettings.surname}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, surname: v.target.value }))}
                                            />
                                        </div>

                                        <div className="w-full space-y-2">
                                            <Label>
                                                Phone number
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your phone number +27"
                                                value={accountSettings.phone_number}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, phone_number: v.target.value }))}
                                            />
                                        </div>
                                        <div className="w-full space-y-2">
                                            <Label>
                                                Date of Birth
                                            </Label>
                                            <Input
                                                type="date"
                                                value={accountSettings.date_of_birth?.replaceAll("/", "-")}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, date_of_birth: v.target.value.replaceAll("-", "/") }))}
                                            />
                                        </div>
                                    </div>
                                </SettingRow>
                                <Separator />
                                <SettingRow
                                    icon={<Globe className="h-5 w-5" />}
                                    title="Address Details"
                                    description="Please enter your address details"
                                    setWidthFlex={true}
                                >
                                    <div className="space-y-4">
                                        <div className="flex space-x-4">
                                            <div className="w-full space-y-2">
                                                <Label>
                                                    Address Line 1
                                                </Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Enter address line 1"
                                                    value={accountSettings.address_line_1}
                                                    onChange={(v) => setAccountSettings(prev => ({ ...prev, address_line_1: v.target.value }))}
                                                />
                                            </div>
                                            <div className="w-full space-y-2">
                                                <Label>
                                                    Address Line 2
                                                </Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Enter address line 2"
                                                    value={accountSettings.address_line_2}
                                                    onChange={(v) => setAccountSettings(prev => ({ ...prev, address_line_2: v.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full space-y-2">
                                            <Label>
                                                Suburb
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your suburb"
                                                value={accountSettings.suburb}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, suburb: v.target.value }))}
                                            />
                                        </div>
                                        <div className="w-full space-y-2">
                                            <Label>
                                                City
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your city"
                                                value={accountSettings.city}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, city: v.target.value }))}
                                            />
                                        </div>
                                        <div className="w-full space-y-2">
                                            <Label>
                                                Postal Code
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your postal code"
                                                value={accountSettings.postal_code}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, postal_code: v.target.value }))}
                                            />
                                        </div>
                                        <div className="w-full space-y-2">
                                            <Label>
                                                Country
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your country"
                                                value={accountSettings.country}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, country: v.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </SettingRow>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <SettingRow
                                    icon={<Bell className="h-5 w-5" />}
                                    title="Email Notifications"
                                    description="Receive notifications via email"
                                >
                                    <Switch
                                        checked={notifications.email}
                                        onCheckedChange={(checked) =>
                                            setNotifications(prev => ({ ...prev, email: checked }))
                                        }
                                    />
                                </SettingRow>
                                {/* <Separator />
                                <SettingRow
                                    icon={<Smartphone className="h-5 w-5" />}
                                    title="Push Notifications"
                                    description="Receive push notifications on your devices"
                                >
                                    <Switch
                                        checked={notifications.push}
                                        onCheckedChange={(checked) =>
                                            setNotifications(prev => ({ ...prev, push: checked }))
                                        }
                                    />
                                </SettingRow> */}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <SettingRow
                                    icon={<Shield className="h-5 w-5" />}
                                    title="Two-Factor Authentication"
                                    description="Add an extra layer of security to your account"
                                >
                                    <Switch
                                        checked={security.twoFactor}
                                        onCheckedChange={(checked) =>
                                            setSecurity(prev => ({ ...prev, twoFactor: checked }))
                                        }
                                    />
                                </SettingRow>
                                <Separator />
                                <SettingRow
                                    icon={<Lock className="h-5 w-5" />}
                                    title="Password"
                                    description="Change your account password"
                                >
                                    <Button variant="outline" size="sm">
                                        Change
                                    </Button>
                                </SettingRow>
                            </CardContent>
                        </Card>
                    </TabsContent> */}

                    {/* <TabsContent value="appearance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <SettingRow
                                    icon={theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                                    title="Theme"
                                    description="Switch between light and dark mode"
                                >
                                    <Switch
                                        checked={theme === "dark"}
                                        onCheckedChange={(checked) =>
                                            setTheme(checked ? "dark" : "light")
                                        }
                                    />
                                </SettingRow>
                            </CardContent>
                        </Card>
                    </TabsContent> */}
                </Tabs>
            </div>
        </Pager>
    );
}