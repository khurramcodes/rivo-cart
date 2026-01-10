"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/slices/authSlice";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const status = useAppSelector((s) => s.auth.status);
  const error = useAppSelector((s) => s.auth.error);

  useEffect(() => {
    if (user?.role === "ADMIN") router.replace("/admin");
  }, [router, user]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const loggedInUser = await dispatch(login(values)).unwrap();
      router.replace(loggedInUser.role === "ADMIN" ? "/admin" : "/");
    } catch {
      // handled by redux state (auth.error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Admin login</h1>
        <p className="mt-1 text-sm text-zinc-600">Restricted access.</p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div>
            <label className="text-sm font-medium text-zinc-800">Email</label>
            <Input className="mt-2" type="email" {...form.register("email")} />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-800">Password</label>
            <Input className="mt-2" type="password" {...form.register("password")} />
          </div>
          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </main>
    </div>
  );
}


