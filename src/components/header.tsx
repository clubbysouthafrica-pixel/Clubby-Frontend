"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {Link, useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {ChevronDown, Menu, X} from "lucide-react";
import {useContext, useState} from "react";
import {AuthContext, AuthContextType} from "@/context/AuthContext.tsx";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
    DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {useKeyboardShortcut} from "@/hooks/useKeyboardShortcut.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import Img from "@/assets/logo.png"

const components: { title: string; href: string; description: string }[] = [
    {
        title: "Get Started",
        href: "/getstarted",
        description:
            "Get started with your clubs and how to manage your clubs.",
    },
    {
        title: "About us",
        href: "/about",
        description:
            "Find out more about us. Who we are and what we do.",
    },
]

export default function Header() {
    const {user, logout} = useContext(AuthContext) as AuthContextType
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false);

    const signOut = () => {
        logout()
        navigate("/login")
    }

    useKeyboardShortcut({
        key: 'q',
        modifiers: ['cmd', "shift"],
        description: "logout",
        callback: () => logout(),
    });
    useKeyboardShortcut({
        key: 'b',
        modifiers: ['cmd'],
        description: "Open billing",
        callback: () => navigate("/billing"),
    });
    useKeyboardShortcut({
        key: 's',
        modifiers: ['cmd'],
        description: "Open Settings",
        callback: () => navigate("/settings"),
    });
    useKeyboardShortcut({
        key: 'p',
        modifiers: ['cmd', 'shift'],
        description: "Open Profile",
        callback: () => navigate("/profile"),
    });


    return (
        <nav className="p-3 backdrop-blur-xl sticky top-0 z-50"
        style={{
            backgroundColor: "color-mix(in oklch, var(--background) 85%, transparent)",
          }}
        >
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="font-bold flex space-x-2 content-center align-middle">
                    <img src={Img} className="w-8 h-8"/>
                    <p className="self-center">{import.meta.env.VITE_BRAND_NAME}</p>
                </Link>
                <NavigationMenu className="hidden md:flex">
                    <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="cursor-pointer bg-transparent">Clubs</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                <li className="row-span-3">
                                    <NavigationMenuLink asChild>
                                        <Link
                                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                            to="/getstarted"
                                        >
                                            {/*<Icons.logo className="h-6 w-6" />*/}
                                            <div className="mb-2 mt-4 text-lg font-medium">
                                                {import.meta.env.VITE_BRAND_NAME}
                                            </div>
                                            <p className="text-sm leading-tight text-muted-foreground">
                                                Join sports clubs and manage your clubs from one place.
                                            </p>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                <ListItem href="/myclubs" title="My Clubs">
                                    View all your clubs you have joined.
                                </ListItem>
                                {/* <ListItem href="/memberships" title="My Memberships">
                                    View all your memberships.
                                </ListItem> */}
                                <ListItem href="/clubs" title="Browse Clubs">
                                    Browse Clubs
                                </ListItem>
                                {/*<ListItem href="/" title="Typography">*/}
                                {/*    Styles for headings, paragraphs, lists...etc*/}
                                {/*</ListItem>*/}
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem >
                        <NavigationMenuTrigger className="cursor-pointer bg-transparent">About</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                {components.map((component) => (
                                    <ListItem
                                        key={component.title}
                                        title={component.title}
                                        href={component.href}
                                    >
                                        {component.description}
                                    </ListItem>
                                ))}
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                            <Link to="/contactus" className={navigationMenuTriggerStyle() + " cursor-pointer bg-transparent"}>
                                Contact Us
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>
                </NavigationMenu>
                {
                    user ?
                        <div className="space-x-2 flex">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="shadow-none"><Avatar className="w-6 h-6">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar> <ChevronDown/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    {/* <Link to="/profile" className="w-full">
                                        <DropdownMenuItem>
                                                Profile
                                                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/billing">
                                        <DropdownMenuItem>
                                            Billing
                                            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                    </Link> */}
                                    <Link to="/settings">
                                        <DropdownMenuItem>
                                            Settings
                                            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                    </Link>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={signOut}>
                                    Log out
                                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                            {/* <ModeToggle /> */}
                            {/* Mobile Menu Button */}
                            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>:
                        <div className="space-x-2 flex">
                            <Link to="/login" className="cursor-pointer">
                                <Button className="cursor-pointer">
                                    Sign In
                                </Button>
                            </Link>
                            {/* <ModeToggle /> */}
                            {/* Mobile Menu Button */}
                            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                }
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden flex flex-col space-y-4 mt-4">
                    <Link to="/" className="hover:text-blue-500">Home</Link>
                    <Link to="/myclubs" className="hover:text-blue-500">My Clubs</Link>
                    <Link to="/clubs" className="hover:text-blue-500">Browse Clubs</Link>
                    <Link to="/contactus" className="hover:text-blue-500">Contact Us</Link>
                </div>
            )}
        </nav>
    )
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
