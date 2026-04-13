"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { ChevronDown, Menu, X, User, Sparkles } from "lucide-react";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut.tsx";
import { Avatar } from "@/components/ui/avatar.tsx";
import Img from "@/assets/logo.png";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Get Started",
    href: "/getstarted",
    description: "Get started with your clubs and how to manage your clubs.",
  },
  {
    title: "About us",
    href: "/about",
    description: "Find out more about us. Who we are and what we do.",
  },
];

export default function Header() {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = authContext?.user ?? null;
  const logout = authContext?.logout;

  const signOut = () => {
    if (!logout) {
      navigate("/login", { replace: true });
      return;
    }

    logout();
    navigate("/login");
  };

  useKeyboardShortcut({
    key: "q",
    modifiers: ["cmd", "shift"],
    description: "logout",
    callback: () => logout?.(),
  });
  useKeyboardShortcut({
    key: "b",
    modifiers: ["cmd"],
    description: "Open billing",
    callback: () => navigate("/billing"),
  });
  useKeyboardShortcut({
    key: "s",
    modifiers: ["cmd"],
    description: "Open Settings",
    callback: () => navigate("/settings"),
  });
  useKeyboardShortcut({
    key: "p",
    modifiers: ["cmd", "shift"],
    description: "Open Profile",
    callback: () => navigate("/profile"),
  });

  if (!authContext && location.pathname === "/login") {
    return null;
  }

  return (
    <nav
      className="p-3 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-50"
      style={{
        backgroundColor:
          "color-mix(in oklch, var(--background) 85%, transparent)",
      }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center space-x-3 group transition-all duration-300 hover:scale-105"
        >
          <div className="relative">
            <img
              src={Img}
              className="w-10 h-10 rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
              alt="Logo"
            />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
              <Sparkles className="w-2 h-2 text-primary-foreground" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {import.meta.env.VITE_BRAND_NAME}
            </span>
          </div>
        </Link>

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="cursor-pointer bg-transparent">
                Clubs
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <Link
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-indigo-50 to-white p-6 no-underline outline-none focus:shadow-md"
                        to="/getstarted"
                      >
                        {/*<Icons.logo className="h-6 w-6" />*/}
                        <div className="mb-2 mt-4 text-lg font-medium">
                          {import.meta.env.VITE_BRAND_NAME}
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Join sports clubs and manage your clubs from one
                          place.
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/myclubs" title="My Clubs">
                    View all your clubs you have joined.
                  </ListItem>
                  <ListItem href="/clubs" title="Browse Clubs">
                    Browse Clubs
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="cursor-pointer bg-transparent">
                About
              </NavigationMenuTrigger>
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
                <Link
                  to="/contactus"
                  className={
                    navigationMenuTriggerStyle() +
                    " cursor-pointer bg-transparent"
                  }
                >
                  Contact Us
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        {user ? (
          <div className="space-x-2 flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="shadow-none flex items-center justify-center gap-2"
                >
                  <Avatar className="w-6 h-6 border-1 border-gray-500 flex items-center justify-center">
                    <User className="" />
                  </Avatar>
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
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
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        ) : (
          <div className="space-x-2 flex">
            <Link to="/login" className="cursor-pointer">
              <Button className="cursor-pointer">Sign In</Button>
            </Link>
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col space-y-4 mt-4">
          <Link
            to="/"
            className="hover:text-blue-500"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/myclubs"
            className="hover:text-blue-500"
            onClick={() => setMenuOpen(false)}
          >
            My Clubs
          </Link>
          <Link
            to="/clubs"
            className="hover:text-blue-500"
            onClick={() => setMenuOpen(false)}
          >
            Browse Clubs
          </Link>
          <Link
            to="/contactus"
            className="hover:text-blue-500"
            onClick={() => setMenuOpen(false)}
          >
            Contact Us
          </Link>
        </div>
      )}
    </nav>
  );
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
            className,
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
  );
});
ListItem.displayName = "ListItem";
