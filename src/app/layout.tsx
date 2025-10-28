// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // Tailwind + base styles
import { HeroUIProvider } from "@heroui/system";
import NavigationBar from "@/components/NavbarComponent";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "1C Web App",
    description: "Manually Crafted With Love",
};

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="min-h-full bg-gradient-to-br from-cyan-50 to-green-50 font-sans antialiased">
        <HeroUIProvider>
            <main className="flex flex-col min-w-full min-h-full">
            <div className="top-0">
                <NavigationBar />
            </div>
                <div className="flex-1">
                    {children}
                </div>
            </main>
        </HeroUIProvider>
        </body>
        </html>
    );
}