"use client";

import Image from "next/image";
import Link from "next/link";
import { NavBar } from "@/components/user/NavBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeFromCart, setQuantity } from "@/store/slices/cartSlice";
import { formatPrice } from "@/config/currency";
import { usePathname, useRouter } from "next/navigation";

export default function CartPage() {
  const items = useAppSelector((s) => s.cart.items);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const status = useAppSelector((s) => s.auth.status);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = () => {
    if (status !== "authenticated") {
      router.push(`/login?return_to=${encodeURIComponent(pathname)}`);
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className='min-h-screen bg-white'>
      <NavBar />
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
                  key={`${i.productId}-${i.variantId}`}
                  className='flex gap-4 rounded border border-zinc-200 p-4'>
                  <div className='relative h-20 w-20 overflow-hidden rounded bg-zinc-100'>
                    <Image
                      src={i.imageUrl}
                      alt={i.name}
                      fill
                      className='object-cover'
                      unoptimized
                    />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-zinc-900'>
                      {i.name}
                    </p>
                    {i.variantDetails ? (
                      <p className='mt-0.5 text-xs text-zinc-500'>
                        {i.variantDetails}
                      </p>
                    ) : null}
                    <p className='mt-1 text-sm text-zinc-600'>
                      {formatPrice(i.price)}
                    </p>
                    <p className='mt-0.5 text-xs text-zinc-400'>SKU: {i.sku}</p>
                    <div className='mt-3 flex items-center gap-3'>
                      <Input
                        className='w-20'
                        type='number'
                        min={1}
                        max={20}
                        value={i.quantity}
                        onChange={(e) =>
                          dispatch(
                            setQuantity({
                              productId: i.productId,
                              variantId: i.variantId,
                              quantity: Number(e.target.value),
                            })
                          )
                        }
                      />
                      <Button
                        variant='ghost'
                        onClick={() =>
                          dispatch(
                            removeFromCart({
                              productId: i.productId,
                              variantId: i.variantId,
                            })
                          )
                        }>
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className='text-sm font-medium text-zinc-900'>
                    {formatPrice(i.price * i.quantity)}
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
