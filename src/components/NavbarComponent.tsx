// src/components/NavigationBar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {  LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UnaLogo } from "@/components/UnaLogo"; // Your JPG logo

// Helper: List item for mega menu
const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { title: string }
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
    );
});
ListItem.displayName = "ListItem";

// Logout function (replace with your actual)
const SignOut = () => {
    // Example: clear session + redirect
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
        window.location.href = "/login";
    });
};

export default function NavigationBar() {
    const pathname = usePathname();

    if (pathname === "/login") return null;

    return (
        <div className="border-b bg-cyan-950 w-full">
            <div className="container flex h-12 items-center justify-between min-w-full">
                {/* Logo + Title */}
                <div className="flex items-center gap-2 h-fit">
                    <span className="font-bold text-white text-xl">UNA@md</span>
                    <UnaLogo />
                </div>

                {/* Center: Navigation */}
                <NavigationMenu>
                    <NavigationMenuList className="flex gap-10">
                        {/* 1. Carte de Referinta */}
                        <NavigationMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <NavigationMenuTrigger className="bg-gray-400">Carte de Referinta</NavigationMenuTrigger>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-64 bg-gray-300" align="start">
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={"/dashboard/carte-referinta/agent-creation"}
                                            className="flex w-full items-center justify-between"
                                        >
                                            Creare ContraAgent
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </NavigationMenuItem>

                        {/* 2. Documente → Contabilitatea Stocurilor */}
                        <NavigationMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <NavigationMenuTrigger className="bg-gray-400">Documente</NavigationMenuTrigger>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-64 bg-gray-400" align="start">
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="bg-gray-300 hover:bg-gray-400">
                                            <span>Contabilitatea Stocurilor</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem asChild>
                                                    <Link href={"/dashboard/documente/contabilitatea-stocurilor/realizare-stoc"} className="flex w-full items-center">
                                                        Realizare Stoc
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={"/dashboard/documente/contabilitatea-stocurilor/mutare-stoc"} className="flex w-full items-center">
                                                        Mutare Stoc
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </NavigationMenuItem>

                        {/* 3. Rapoarte → Tranzactii & ContraAgent */}
                        <NavigationMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <NavigationMenuTrigger className="bg-gray-400">Rapoarte</NavigationMenuTrigger>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-72" align="start">
                                    {/* Tranzactii */}
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="bg-gray-200">
                                            <span>Tranzactii</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem asChild>
                                                    <Link href={"/dashboard/rapoarte/tranzactii/realizare-stoc"}>
                                                        Realizare Stoc
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={"/dashboard/rapoarte/tranzactii/mutare-stoc"}>
                                                        Mutare Stoc
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>

                                    {/* ContraAgent */}
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <span>ContraAgent</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem asChild>
                                                    <Link href={"/dashboard/rapoarte/contragent/decontari"}>
                                                        Decontari Reciproce
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                {/* Right: Logout */}
                <Button className="bg-gray-300 hover:bg-gray-500" size="sm" onClick={SignOut}>
                    <LogOut className="mr-2 h-4 w-4 text-black" />
                   <span className="text-black">Deconectare</span>
                </Button>
            </div>
        </div>
    );
}