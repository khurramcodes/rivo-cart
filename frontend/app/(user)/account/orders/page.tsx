"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAppSelector } from "@/store/hooks";

export default function OrdersPage() {
  const user = useAppSelector((s) => s.auth.user);

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Orders</h1>
        <p className="mt-2 text-sm text-zinc-600">Please login to view your orders.</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Orders</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Your order history will appear here once available.
      </p>
    </div>
  );
}
