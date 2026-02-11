"use client";

import { useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/types";
import { adminApi } from "@/services/adminApi";
import { formatPrice } from "@/config/currency";
import { Modal } from "@/components/ui/Modal";
import { parseVariantSnapshot } from "@/utils/variantSnapshot";

const statuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const totalOrdersCount = useMemo(() => orders.length, [orders.length]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await adminApi.listOrders();
        if (mounted) setOrders(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setSavingId(orderId);
    try {
      const updated = await adminApi.updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === updated.id ? { ...o, status: updated.status } : o
        )
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
        Orders
      </h1>
      <p className='mt-2 text-sm text-zinc-600'>Manage all orders.</p>

      {loading ? <p className='mt-6 text-sm text-zinc-600'>Loading…</p> : null}
      {!loading && orders.length === 0 ? (
        <p className='mt-6 text-sm text-zinc-600'>No orders yet.</p>
      ) : null}

      {orders.length > 0 ? (
        <div className='mt-6 overflow-hidden rounded border border-zinc-200'>
          <div className='grid grid-cols-12 gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-600'>
            <div className='col-span-3'>Order</div>
            <div className='col-span-3'>Customer</div>
            <div className='col-span-2'>Total</div>
            <div className='col-span-2'>Status</div>
            <div className='col-span-2'>Created</div>
          </div>
          {orders.map((o) => (
            <div
              key={o.id}
              className='grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm'>
              <div className='col-span-3'>
                <p
                  onClick={() => setSelectedOrder(o)}
                  className='font-medium text-blue-800 cursor-pointer'>
                  {o.id}
                </p>
              </div>
              <div className='col-span-3'>
                <p className='text-zinc-900'>{o.customerName}</p>
                <p className='mt-1 text-xs text-zinc-500'>{o.customerPhone}</p>
              </div>
              <div className='col-span-2 font-medium text-zinc-900'>
                {formatPrice(o.totalAmount)}
              </div>
              <div className='col-span-2'>
                <select
                  className='h-9 w-full rounded border text-zinc-900 border-zinc-200 bg-white px-2 text-sm'
                  value={o.status}
                  disabled={savingId === o.id}
                  onChange={(e) =>
                    void updateStatus(o.id, e.target.value as OrderStatus)
                  }>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className='col-span-2 text-zinc-600'>
                {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title='Order Detail'
        size='lg'>
        <div className='space-y-4 max-h-[70vh] overflow-y-auto pr-2'>
          {selectedOrder ? (
            <div className='space-y-6'>
              {/* Order meta */}
              <div className='grid grid-cols-2 gap-4 text-sm text-zinc-900'>
                <div>
                  <p className='font-semibold text-xl'>Order ID</p>
                  <p className='font-medium'>{selectedOrder.id}</p>
                </div>

                <div>
                  <p className='inline-block bg-amber-300 p-2 rounded font-medium'>
                    {selectedOrder.status}
                  </p>
                </div>

                <div>
                  <p className='font-semibold text-xl'>Billing Details</p>
                  <p className='font-medium'>{selectedOrder.customerName}</p>
                  <p className='text-xs text-zinc-500'>
                    {selectedOrder.customerPhone}
                  </p>
                  <p>{selectedOrder.shippingAddress}</p>
                </div>
              </div>

              {/* Order items */}
              {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                <div className='divide-y border border-gray-300 text-zinc-900'>
                  {selectedOrder.items.map((item) => {
                    const variantAttributes = parseVariantSnapshot(
                      item.variantSnapshot
                    );

                    return (
                      <div
                        key={item.id}
                        className='flex justify-between px-4 py-3 text-sm'>
                        <div>
                          <p className='font-medium '>{item.product?.name}</p>
                          <div className='text-xs text-zinc-500'>
                            {variantAttributes && (
                              <div className='mt-1 space-y-0.5 text-xs text-zinc-500'>
                                {Object.entries(variantAttributes).map(
                                  ([key, value]) => (
                                    <div key={key}>
                                      <span className='font-medium'>
                                        {key}:
                                      </span>{" "}
                                      {value}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          <p className='text-xs text-zinc-500'>
                            Qty: {item.quantity}
                          </p>
                        </div>

                        <div className='font-medium'>
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className='text-sm text-zinc-500'>No items found.</p>
              )}
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
