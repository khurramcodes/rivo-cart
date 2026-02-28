"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { orderApi } from "@/services/orderApi";
import type { Order } from "@/types";
import { formatPrice } from "@/config/currency";
import { CircleCheckBig, Package, MapPin, CreditCard, ChevronRight } from "lucide-react";

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const ORDER_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber?.trim()) {
      setLoading(false);
      setError("Order reference is missing.");
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    orderApi
      .getByOrderNumber(orderNumber.trim())
      .then((data) => {
        if (mounted) setOrder(data);
      })
      .catch((err) => {
        if (!mounted) return;
        const msg =
          err?.response?.data?.error?.message ||
          err?.message ||
          "We couldn’t load this order. It may not belong to your account.";
        setError(msg);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-zinc-900">Order not found</h1>
            <p className="mt-2 text-sm text-zinc-600">{error ?? "This order could not be loaded."}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/account/orders"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                View my orders
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-secondary"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const subtotal = order.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? order.totalAmount;
  const shipping = order.shippingCost ?? 0;
  const total = order.totalAmount;

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CircleCheckBig className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Thank you for your order
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Your Cash on Delivery order has been placed. We’ll send you an update when it’s on its way.
          </p>
        </div>

        {/* Order reference card */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Order number</p>
              <p className="text-lg font-semibold text-zinc-900 mt-0.5">{order.orderNumber}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${ORDER_STATUS_STYLE[order.status] ?? "bg-zinc-100 text-zinc-800"}`}
            >
              {ORDER_STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <div className="px-6 py-3 text-sm text-zinc-500">
            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* Order items */}
        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Order items</h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {order.items?.map((item) => (
              <li key={item.id} className="flex gap-4 px-6 py-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                  {item.product?.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name ?? ""}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{item.product?.name ?? "Product"}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">SKU: {item.sku} · Qty: {item.quantity}</p>
                  <p className="mt-1 text-sm text-zinc-700">
                    {formatPrice(item.price)} × {item.quantity} = {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Shipping & payment */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-900">Shipping address</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm font-medium text-zinc-900">{order.customerName}</p>
              <p className="text-sm text-zinc-600 mt-1 whitespace-pre-line">{order.shippingAddress}</p>
              <p className="text-sm text-zinc-600 mt-1">{order.customerPhone}</p>
            </div>
          </section>
          <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-900">Payment</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm font-medium text-zinc-900">Cash on Delivery (COD)</p>
              <p className="text-xs text-zinc-500 mt-1">Pay when you receive your order</p>
            </div>
          </section>
        </div>

        {/* Order summary */}
        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Order summary</h2>
          </div>
          <div className="px-6 py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600">Subtotal</span>
              <span className="text-zinc-900">{formatPrice(subtotal)}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Shipping</span>
                <span className="text-zinc-900">{formatPrice(shipping)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-zinc-100">
              <span className="text-zinc-900">Total</span>
              <span className="text-zinc-900">{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            View my orders
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><GlobalLoader /></div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
