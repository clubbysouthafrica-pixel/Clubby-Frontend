import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
    Bell,
    Globe,
    User,
    Settings,
    Save,
    MapPin,
    Phone,
    Calendar,
    CreditCard
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
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 p-6 rounded-lg border border-primary/10 bg-gradient-to-r from-background to-muted/20 hover:from-primary/5 hover:to-primary/10 transition-all duration-300 group">
        <div className="flex gap-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="text-primary">
                    {icon}
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </div>
        <div className={setWidthFlex ? "flex-1 lg:max-w-md" : "flex-shrink-0"}>{children}</div>
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
        onError: (error: unknown) => {
            const errorMessage = error && typeof error === 'object' && 'response' in error 
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
                : "An unexpected error occurred.";
            toast.error(errorMessage || "An unexpected error occurred.");
        }
    })

    return (
        <Pager>
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-muted/20">
                <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_85%)]" />
                <div className="container mx-auto px-4 py-16 relative">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="space-y-4">
                                <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-in fade-in-50 duration-300">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Account Management
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    Settings
                                </h1>
                                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                                    Manage your account preferences, personal information, and customize your experience to suit your needs.
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <Button 
                                    onClick={saveProfileSettings}
                                    disabled={isPending}
                                    size="lg"
                                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <Save className="w-5 h-5 mr-2" />
                                    {isPending ? "Saving Changes..." : "Save Changes"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container max-w-4xl mx-auto px-4 py-12">

                <Tabs defaultValue="account" className="space-y-8">
                    <TabsList className="bg-background/50 backdrop-blur-sm border border-primary/20 shadow-lg h-14 p-1">
                        <TabsTrigger 
                            value="account" 
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium h-12 px-6"
                        >
                            <User className="w-4 h-4 mr-2" />
                            Account
                        </TabsTrigger>
                        {/* <TabsTrigger 
                            value="notifications" 
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium h-12 px-6"
                        >
                            <Bell className="w-4 h-4 mr-2" />
                            Notifications
                        </TabsTrigger> */}
                        {/* <TabsTrigger 
                            value="security" 
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium h-12 px-6"
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger 
                            value="appearance" 
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium h-12 px-6"
                        >
                            <Palette className="w-4 h-4 mr-2" />
                            Appearance
                        </TabsTrigger> */}
                    </TabsList>

                    <TabsContent value="account" className="space-y-8">
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Account Information</h2>
                                <p className="text-muted-foreground">
                                    Manage your personal details and account settings
                                </p>
                            </div>

                            {/* Personal Information */}
                            <SettingRow
                                icon={<User className="h-5 w-5" />}
                                title="Personal Information"
                                description="Your basic profile information used across the platform"
                                setWidthFlex={true}
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                First Name
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your first name"
                                                value={accountSettings.first_name}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, first_name: v.target.value }))}
                                                className="border-primary/20 focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Surname
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your surname"
                                                value={accountSettings.surname}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, surname: v.target.value }))}
                                                className="border-primary/20 focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                Phone Number
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your phone number"
                                                value={accountSettings.phone_number}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, phone_number: v.target.value }))}
                                                className="border-primary/20 focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Date of Birth
                                            </Label>
                                            <Input
                                                type="date"
                                                value={accountSettings.date_of_birth?.replaceAll("/", "-")}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, date_of_birth: v.target.value.replaceAll("-", "/") }))}
                                                className="border-primary/20 focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </SettingRow>

                            {/* Address Information */}
                            <SettingRow
                                icon={<MapPin className="h-5 w-5" />}
                                title="Address Information"
                                description="Your residential address for account verification and communications"
                                setWidthFlex={true}
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Address Line 1
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Street address"
                                                value={accountSettings.address_line_1}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, address_line_1: v.target.value }))}
                                                className="border-primary/20 focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Address Line 2
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Apartment, suite, etc."
                                                value={accountSettings.address_line_2}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, address_line_2: v.target.value }))}
                                                className="border-primary/20 focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Suburb
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Suburb"
                                                value={accountSettings.suburb}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, suburb: v.target.value }))}
                                                className="border-primary/20 focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                City
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="City"
                                                value={accountSettings.city}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, city: v.target.value }))}
                                                className="border-primary/20 focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Postal Code
                                            </Label>
                                            <Input
                                                type="text"
                                                placeholder="Postal code"
                                                value={accountSettings.postal_code}
                                                onChange={(v) => setAccountSettings(prev => ({ ...prev, postal_code: v.target.value }))}
                                                className="border-primary/20 focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <Globe className="w-4 h-4" />
                                            Country
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="Country"
                                            value={accountSettings.country}
                                            onChange={(v) => setAccountSettings(prev => ({ ...prev, country: v.target.value }))}
                                            className="border-primary/20 focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            </SettingRow>
                        </div>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-8">
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Notification Settings</h2>
                                <p className="text-muted-foreground">
                                    Control how and when you receive notifications from us
                                </p>
                            </div>

                            <SettingRow
                                icon={<Bell className="h-5 w-5" />}
                                title="Email Notifications"
                                description="Receive important updates, club activities, and system notifications via email"
                            >
                                <Switch
                                    checked={notifications.email}
                                    onCheckedChange={(checked) =>
                                        setNotifications(prev => ({ ...prev, email: checked }))
                                    }
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingRow>

                            <SettingRow
                                icon={<Bell className="h-5 w-5" />}
                                title="Push Notifications"
                                description="Get instant notifications directly to your device for urgent updates"
                            >
                                <Switch
                                    checked={notifications.push}
                                    onCheckedChange={(checked) =>
                                        setNotifications(prev => ({ ...prev, push: checked }))
                                    }
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingRow>

                            <SettingRow
                                icon={<CreditCard className="h-5 w-5" />}
                                title="Marketing Communications"
                                description="Receive promotional emails about new features, events, and special offers"
                            >
                                <Switch
                                    checked={notifications.marketing}
                                    onCheckedChange={(checked) =>
                                        setNotifications(prev => ({ ...prev, marketing: checked }))
                                    }
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingRow>
                        </div>
                    </TabsContent>

                    {/* <TabsContent value="security" className="space-y-8">
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Security Settings</h2>
                                <p className="text-muted-foreground">
                                    Manage your account security and privacy preferences
                                </p>
                            </div>

                            <SettingRow
                                icon={<Shield className="h-5 w-5" />}
                                title="Two-Factor Authentication"
                                description="Add an extra layer of security to your account with 2FA authentication"
                            >
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                                        Enable 2FA
                                    </Button>
                                </div>
                            </SettingRow>

                            <SettingRow
                                icon={<Shield className="h-5 w-5" />}
                                title="Password Security"
                                description="Update your password to keep your account secure"
                            >
                                <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                                    Change Password
                                </Button>
                            </SettingRow>

                            <SettingRow
                                icon={<Shield className="h-5 w-5" />}
                                title="Login Activity"
                                description="Monitor recent login activity and manage active sessions"
                            >
                                <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                                    View Activity
                                </Button>
                            </SettingRow>
                        </div>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-8">
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Appearance Settings</h2>
                                <p className="text-muted-foreground">
                                    Customize the look and feel of your experience
                                </p>
                            </div>

                            <SettingRow
                                icon={<Palette className="h-5 w-5" />}
                                title="Theme Preference"
                                description="Choose between light and dark mode for better viewing experience"
                            >
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                                        Light Mode
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                                        Dark Mode
                                    </Button>
                                </div>
                            </SettingRow>

                            <SettingRow
                                icon={<Sparkles className="h-5 w-5" />}
                                title="Interface Density"
                                description="Adjust the spacing and size of interface elements"
                            >
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                                        Compact
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                                        Default
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                                        Comfortable
                                    </Button>
                                </div>
                            </SettingRow>
                        </div>
                    </TabsContent> */}
                </Tabs>
            </div>
        </Pager>
    );
}