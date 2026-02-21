"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/services/authApi";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import Logo from "@/components/ui/Logo";

const schema = z.object({
  email: z.string().min(1, "Email is required").pipe(z.email({ message: "Invalid email" })),
});

type FormValues = z.infer<typeof schema>;

function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setMessage(null);
    try {
      const res = await authApi.forgotPassword({ email: values.email });
      setMessage(res.message);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? "Failed to send reset email.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="mb-4">
        <Logo />
      </div>
      <main className="w-sm max-w-sm border border-zinc-300 bg-[#f5f3ef] px-10 py-12 rounded">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Forgot password</h1>
        <p className="mt-1 text-sm text-zinc-600">We’ll email you a reset link.</p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-zinc-800">Email</label>
            <Input className="mt-2 border border-zinc-300" type="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          {message ? (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-800">{message}</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-zinc-600">
          Remembered your password?{" "}
          <Link href="/login" className="text-zinc-900 underline underline-offset-4">
            Back to login
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

