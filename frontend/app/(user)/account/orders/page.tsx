"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAppSelector } from "@/store/hooks";
import { orderApi } from "@/services/orderApi";
import type { Order } from "@/types";
import { formatPrice } from "@/config/currency";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { Package, ChevronRight } from "lucide-react";

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

export default function OrdersPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    orderApi
      .listMyOrders()
      .then((data) => {
        if (mounted) setOrders(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.error?.message ?? err?.message ?? "Failed to load orders.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Orders</h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Orders</h1>
      <p className="mt-2 text-sm text-zinc-600">
        {orders.length === 0
          ? "You haven't placed any orders yet."
          : `You have ${orders.length} order${orders.length === 1 ? "" : "s"}.`}
      </p>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-4 text-sm font-medium text-zinc-700">No orders yet</p>
          <p className="mt-1 text-sm text-zinc-500">Your order history will appear here once you place an order.</p>
          <Link href="/products" className="mt-6 inline-block">
            <Button>Browse products</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Order number
                  </p>
                  <p className="text-lg font-semibold text-zinc-900 mt-0.5">{order.orderNumber}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      ORDER_STATUS_STYLE[order.status] ?? "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <span className="text-base font-semibold text-zinc-900">
                    {formatPrice(order.totalAmount)}
                  </span>
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    View details
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
