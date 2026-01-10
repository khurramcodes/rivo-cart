"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { NavBar } from "@/components/NavBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const status = useAppSelector((s) => s.auth.status);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    const res = await dispatch(login(values));
    if (login.fulfilled.match(res)) router.push("/");
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Login</h1>
        <p className="mt-1 text-sm text-zinc-600">Use your customer account.</p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-zinc-600">
          New here?{" "}
          <Link href="/register" className="text-zinc-900 underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}


