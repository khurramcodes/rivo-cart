"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/services/authApi";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import Logo from "@/components/user/Logo";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";
  const userId = searchParams.get("uid") ?? "";

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const missingParams = useMemo(() => !token || !userId, [token, userId]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setMessage(null);
    try {
      const res = await authApi.resetPassword({ userId, token, password: values.password });
      setMessage(res.message);
      // After reset, user must log in again
      setTimeout(() => router.push("/login"), 800);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? "Failed to reset password.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="mb-4">
        <Logo />
      </div>
      <main className="w-sm max-w-sm border border-zinc-300 bg-[#f5f3ef] px-10 py-12 rounded">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Reset password</h1>
        <p className="mt-1 text-sm text-zinc-600">Set a new password for your account.</p>

        {missingParams ? (
          <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-800">Invalid reset link.</p>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm font-medium text-zinc-800">New password</label>
              <Input className="mt-2 border border-zinc-300" type="password" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
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
              {form.formState.isSubmitting ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-sm text-zinc-600">
          <Link href="/login" className="text-zinc-900 underline underline-offset-4">
            Back to login
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

