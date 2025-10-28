import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-amber-50">
            <main className="flex bg-amber-300">{children}</main>
        </div>
    );
}