"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { NavBar } from "@/components/user/NavBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/services/authApi";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = useMemo(() => params.get("email")?.trim() ?? "", [params]);

  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = otp.trim().length === 6 && status !== "loading";

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setError(null);
    try {
      await authApi.verifyEmail({ email, otp });
      setStatus("success");
      router.push("/login");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error?.message
          ? err.response.data.error.message
          : "Verification failed. Please try again.";
      setStatus("error");
      setError(message);
    }
  }

  async function handleResend() {
    if (!email || resendStatus === "loading") return;
    setResendStatus("loading");
    setError(null);
    try {
      await authApi.resendOtp({ email });
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error?.message
          ? err.response.data.error.message
          : "Unable to resend OTP. Please try again.";
      setError(message);
    } finally {
      setResendStatus("idle");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Verify email</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Enter the 6-digit code sent to your email.
        </p>

        {!email ? (
          <div className="mt-6 rounded border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Missing email. Please{" "}
            <Link href="/register" className="text-zinc-900 underline underline-offset-4">
              register
            </Link>{" "}
            again.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleVerify}>
            <div>
              <label className="text-sm font-medium text-zinc-800">OTP</label>
              <Input
                className="mt-2"
                inputMode="numeric"
                pattern="\d{6}"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
              />
            </div>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {status === "loading" ? "Verifying…" : "Verify"}
            </Button>
          </form>
        )}

        {email ? (
          <div className="mt-4 text-sm text-zinc-600">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              className="text-zinc-900 underline underline-offset-4"
              disabled={resendStatus === "loading"}>
              {resendStatus === "loading" ? "Resending…" : "Resend OTP"}
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
