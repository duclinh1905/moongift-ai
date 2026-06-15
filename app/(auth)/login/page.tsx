import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false
  }
};

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">MoonGift AI CRM</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with an admin account to manage leads and quotes.</p>
        <LoginForm />
      </div>
    </main>
  );
}
