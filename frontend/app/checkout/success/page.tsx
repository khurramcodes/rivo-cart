"use client";

import { GlobalLoader } from "@/components/ui/GlobalLoader";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckoutSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Order placed</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Thanks! Your Cash on Delivery order has been placed.
          {orderId ? <> Order ID: <span className="font-medium text-zinc-900">{orderId}</span></> : null}
        </p>
        <div className="mt-6">
          <Link href="/products" className="text-sm text-zinc-900 underline underline-offset-4">
            Continue shopping
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}


