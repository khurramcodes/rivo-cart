"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/slices/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import Image from "next/image";
import Logo from "@/components/user/Logo";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .pipe(z.email({ message: "Invalid email" })),

  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = useAppSelector((s) => s.auth.status);
  const error = useAppSelector((s) => s.auth.error);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    const returnTo = searchParams.get("return_to");
    const res = await dispatch(login(values));
    if (login.fulfilled.match(res)) router.replace(returnTo || "/");
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-white'>
      <div className="mb-4">
        <Logo />
      </div>
      <main className='w-sm max-w-sm border border-zinc-200 px-10 py-12 rounded'>
        <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
          Login
        </h1>
        <p className='mt-1 text-sm text-zinc-600'>Use your customer account.</p>

        <form className='mt-6 space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className='text-sm font-medium text-zinc-800'>Email</label>
            <Input className='mt-2' type='email' {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className='mt-1 text-sm text-red-600'>
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className='text-sm font-medium text-zinc-800'>
              Password
            </label>
            <Input
              className='mt-2'
              type='password'
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className='mt-1 text-sm text-red-600'>
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          {error && (
            <div className='rounded border border-red-200 bg-red-50 px-4 py-3'>
              <p className='text-sm text-red-800'>{error}</p>
            </div>
          )}

          <Button
            type='submit'
            className='w-full'
            disabled={status === "loading"}>
            {status === "loading" ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className='mt-4 text-sm text-zinc-600'>
          New here?{" "}
          <Link
            href='/register'
            className='text-zinc-900 underline underline-offset-4'>
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <LoginForm />
    </Suspense>
  );
}
