"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { register } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().optional(),
  email: z
    .string()
    .min(1, "Email is required")
    .pipe(z.email({ message: "Invalid email" })),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&]/,
      "Password must contain at least one special character (!@#$%^&)",
    ),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const status = useAppSelector((s) => s.auth.status);
  const error = useAppSelector((s) => s.auth.error);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      lastName: values.lastName?.trim() || undefined,
    };
    const res = await dispatch(register(payload));
    if (register.fulfilled.match(res)) {
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    }
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-white'>
      <main className='w-md max-w-md border border-zinc-300 bg-muted px-10 py-12 rounded'>
        <div className='mb-4 flex justify-center'>
          <Logo />
        </div>
        <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
          Create account
        </h1>
        <p className='mt-1 text-sm text-zinc-600'>
          Let's create a free account to start shopping.
        </p>

        <form className='mt-6 space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className='text-sm font-medium text-zinc-800'>
              First name
            </label>
            <Input
              className='mt-2 border border-zinc-300'
              placeholder='First name'
              {...form.register("firstName")}
            />
            {form.formState.errors.firstName ? (
              <p className='mt-1 text-sm text-red-600'>
                {form.formState.errors.firstName.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className='text-sm font-medium text-zinc-800'>
              Last name
            </label>
            <Input
              className='mt-2 border border-zinc-300'
              placeholder='Last name'
              {...form.register("lastName")}
            />
            {form.formState.errors.lastName ? (
              <p className='mt-1 text-sm text-red-600'>
                {form.formState.errors.lastName.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className='text-sm font-medium text-zinc-800'>Email</label>
            <Input
              className='mt-2 border border-zinc-300'
              type='email'
              placeholder='Email'
              {...form.register("email")}
            />
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
            <PasswordInput
              className="mt-2 border border-zinc-300"
              placeholder="Password"
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
            {status === "loading" ? "Creating…" : "Create account"}
          </Button>
        </form>

        <p className='mt-4 text-sm text-zinc-600'>
          Already have an account?{" "}
          <Link
            href='/login'
            className='text-zinc-900 underline underline-offset-4'>
            Login
          </Link>
        </p>
      </main>
    </div>
  );
}
