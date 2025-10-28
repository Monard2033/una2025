import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";
// 💡 IMPORT FIX: Import the utility function for creating absolute URLs
import { getAbsoluteUrl } from "@/lib/config";

export default function Login({}: {
    searchParams: { message: string };
}) {
    const signIn = async (formData: FormData) => {
        'use server';

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        // 💡 FIX APPLIED: Use getAbsoluteUrl to ensure a valid URL for server-side fetch
        const loginUrl = getAbsoluteUrl('/api/auth/login');
        
        try {
            const res = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                redirect('/dashboard');
            } else {
                const error = await res.json();
                // Instead of throwing an error that crashes the server action,
                // we should redirect back with the message, or handle the error gracefully.
                // For simplicity, we'll redirect with an error message.
                const message = error.error || 'Invalid credentials';
                redirect(`/login?message=${encodeURIComponent(message)}`);
            }
        } catch (e: any) {
            // Handle network or other unexpected errors during fetch
            console.error("Login Fetch Error:", e);
            redirect(`/login?message=${encodeURIComponent('A apărut o eroare neașteptată.')}`);
        }
    };

    // The component structure remains the same
    return (
        <div className="flex h-screen flex-col items-center bg-content2 w-screen px-8 justify-center gap-2">
            <form className="relative flex flex-col animate-in border-4 p-2 rounded-medium bg-content1 shadow-medium ring-8 ring-cyan-400 ring-opacity-50 w-full md:max-w-md justify-center gap-2 text-foreground
            before:absolute before:inset-0 before:rounded-medium before:border-4 before:border-cyan-400 before:blur-lg before:opacity-50 before:pointer-events-none" action={signIn}>
                <label className="text-large" htmlFor="email">
                    Email
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-cyan-100 border mb-6"
                    name="email"
                    placeholder="@opinca2017@gmail.com"
                    required
                />
                <label className="text-large" htmlFor="password">
                    Parola
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-cyan-100 border mb-6"
                    type="password"
                    name="password"
                    placeholder="123456"
                    required
                />
                <SubmitButton
                    // formAction property is not needed if the form has an 'action' prop
                    className="bg-green-700 rounded-md px-4 py-2 text-foreground mb-2"
                    pendingText="Conectare..."
                >
                    Conectare
                </SubmitButton>
                {/* Display error message from searchParams if present */}
                {/* Note: I removed the original prop in the function signature since you were not using it */}
                {/* If you pass the message prop, you can display it here */}
                {/* {searchParams.message && (
                    <p className="mt-4 p-4 bg-red-100 text-red-600 rounded-lg text-center">{searchParams.message}</p>
                )} */}
            </form>
        </div>
    );
}
