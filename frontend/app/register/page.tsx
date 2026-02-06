"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { register } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
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
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Create account</h1>
        <p className="mt-1 text-sm text-zinc-600">Simple checkout with Cash on Delivery.</p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-zinc-800">First name</label>
            <Input className="mt-2" {...form.register("firstName")} />
            {form.formState.errors.firstName ? (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.firstName.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-800">Last name</label>
            <Input className="mt-2" {...form.register("lastName")} />
            {form.formState.errors.lastName ? (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.lastName.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-800">Email</label>
            <Input className="mt-2" type="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-800">Password</label>
            <Input className="mt-2" type="password" {...form.register("password")} />
            {form.formState.errors.password ? (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          {error && (
            <div className='rounded border border-red-200 bg-red-50 px-4 py-3'>
              <p className='text-sm text-red-800'>{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Creating…" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="text-zinc-900 underline underline-offset-4">
            Login
          </Link>
        </p>
      </main>
    </div>
  );
}


