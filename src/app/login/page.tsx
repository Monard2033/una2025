import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";

export default function Login({}: {
    searchParams: { message: string };
}) {
    const signIn = async (formData: FormData) => {
        'use server';

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                redirect('/dashboard');
            } else {
                const error = await res.json();
                throw new Error(error.error || 'Invalid credentials');
            }
    };

    return (
        <div className="flex h-screen flex-col items-center bg-content2 w-screen px-8 justify-center gap-2">
            <form className="relative flex flex-col animate-in border-4 p-2 rounded-medium bg-content1 shadow-medium ring-8 ring-cyan-400 ring-opacity-50 w-full md:max-w-md justify-center gap-2 text-foreground
  before:absolute before:inset-0 before:rounded-medium before:border-4 before:border-cyan-400 before:blur-lg before:opacity-50 before:pointer-events-none">
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
                    formAction={signIn}
                    className="bg-green-700 rounded-md px-4 py-2 text-foreground mb-2"
                    pendingText="Conectare..."
                >
                    Conectare
                </SubmitButton>
            </form>
        </div>
    );
}