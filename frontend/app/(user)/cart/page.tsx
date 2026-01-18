"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeItem, updateQuantity } from "@/store/cartThunks";
import { formatPrice } from "@/config/currency";
import { usePathname, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const cart = useAppSelector((s) => s.cart.cart);
  const items = cart?.items ?? [];
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const status = useAppSelector((s) => s.auth.status);

  const total = items.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);

  const formatVariantDetails = (attrs: { name: string; value: string }[] | undefined) =>
    attrs && attrs.length > 0 ? attrs.map((attr) => `${attr.name}: ${attr.value}`).join(", ") : "";

  const handleCheckout = () => {
    if (status !== "authenticated") {
      router.push(`/login?return_to=${encodeURIComponent(pathname)}`);
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className='min-h-screen bg-white'>
      <main className='mx-auto max-w-6xl px-4 py-10'>
        <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
          Cart
        </h1>

        {items.length === 0 ? (
          <div className='mt-6 rounded border border-zinc-200 bg-zinc-50 p-6'>
            <p className='text-sm text-zinc-600'>Your cart is empty.</p>
            <Link
              href='/products'
              className='mt-3 inline-block text-sm text-zinc-900 underline underline-offset-4'>
              Browse products
            </Link>
          </div>
        ) : (
          <div className='mt-6 grid gap-6 lg:grid-cols-3'>
            <div className='lg:col-span-2 space-y-3'>
              {items.map((i) => (
                <div
                  key={i.id}
                  className='flex justify-between items-center gap-4 rounded border border-zinc-200 p-4'>
                  <div className='flex flex-1 items-start gap-4'>
                    <div className='relative h-20 w-20 overflow-hidden rounded bg-zinc-100'>
                      <Image
                        src={i.product?.imageUrl ?? "/images/logo.png"}
                        alt={i.product?.name ?? "Product image"}
                        fill
                        className='object-cover'
                        unoptimized
                      />
                    </div>
                    <div className=''>
                    <p className='text-sm font-medium text-zinc-900'>
                      {i.product?.name ?? "Product"}
                    </p>
                    {formatVariantDetails(i.variant?.attributes) ? (
                        <p className='mt-0.5 text-xs text-zinc-500'>
                        {formatVariantDetails(i.variant?.attributes)}
                        </p>
                      ) : null}
                      <p className='mt-1 text-sm text-zinc-600'>
                      {formatPrice(i.priceSnapshot)}
                      </p>
                    <p className='mt-0.5 text-xs text-zinc-400'>SKU: {i.variant?.sku}</p>

                    </div>
                  </div>
                  <div className='mt-3 flex flex-col items-start gap-3'>
                    <Input
                      className='w-4'
                      type='number'
                      min={1}
                      max={Math.max(1, i.variant?.stock ?? 1)}
                      value={i.quantity}
                      onChange={(e) =>
                        dispatch(
                          updateQuantity({ itemId: i.id, quantity: Number(e.target.value) })
                        )
                      }
                    />

                  </div>
                  <div className='text-sm font-medium text-zinc-900'>
                    {formatPrice(i.price * i.quantity)}
                  </div>
                  <div>
                    <p
                      className='cursor-pointer'
                      onClick={() =>
                        dispatch(
                          removeItem({ itemId: i.id })
                        )
                      }>
                      <Trash2 size={16} className='text-red-800' />
                    </p>
                  </div>

                </div>
              ))}
            </div>

            <aside className='rounded border border-zinc-200 p-4 h-fit'>
              <p className='text-sm text-zinc-600'>Total</p>
              <p className='mt-1 text-2xl font-semibold tracking-tight text-zinc-900'>
                {formatPrice(total)}
              </p>
              <div
                onClick={handleCheckout}
                className='mt-4 block cursor-pointer'>
                <Button className='w-full'>Proceed to Checkout</Button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
