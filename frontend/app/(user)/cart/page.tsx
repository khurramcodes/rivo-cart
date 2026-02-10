"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeItem, updateQuantity } from "@/store/cartThunks";
import { formatPrice } from "@/config/currency";
import { usePathname, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cartApi } from "@/services/cartApi";
import { setCart } from "@/store/slices/cartSlice";
import { QuantitySelector } from "@/components/user/QuantitySelector";

export default function CartPage() {
  const cart = useAppSelector((s) => s.cart.cart);
  const cartStatus = useAppSelector((s) => s.cart.status);
  const items = cart?.items ?? [];
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const status = useAppSelector((s) => s.auth.status);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [pricing, setPricing] = useState<{
    originalPrice: number;
    discountedPrice: number;
    lineItems: { itemId: string; originalUnitPrice: number; discountedUnitPrice: number; quantity: number; lineTotal: number }[];
    appliedCoupon: { code: string; amount: number } | null;
    totalSavings: number;
  } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const itemsSignature = useMemo(
    () => items.map((i) => `${i.id}:${i.quantity}`).join(","),
    [items],
  );
  const total = items.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);
  const hasAppliedCoupon = Boolean(cart?.appliedCouponId);
  const appliedCouponCode = pricing?.appliedCoupon?.code;
  // const discountedTotal = pricing?.discountedPrice ?? total;

  const discountedTotal = pricing
    ? pricing.lineItems.reduce((sum, l) => sum + l.lineTotal, 0)
    : total;

  const getLinePricing = (itemId: string) =>
    pricing?.lineItems?.find((l) => l.itemId === itemId);

  const formatVariantDetails = (attrs: { name: string; value: string }[] | undefined) =>
    attrs && attrs.length > 0 ? attrs.map((attr) => `${attr.name}: ${attr.value}`).join(", ") : "";

  const handleCheckout = () => {
    if (status !== "authenticated") {
      router.push(`/login?return_to=${encodeURIComponent(pathname)}`);
      return;
    }
    router.push("/checkout");
  };

  // Refetch pricing when we have a cart and whenever cart sync completes (status → idle)
  // so totals update after quantity change, add, remove, etc.
  useEffect(() => {
    if (!cart?.id || cartStatus !== "idle") return;
    let mounted = true;
    setPricingLoading(true);
    cartApi
      .getPricing()
      .then((data) => {
        if (!mounted) return;
        setPricing({
          originalPrice: data.pricing.originalPrice,
          discountedPrice: data.pricing.discountedPrice,
          lineItems: data.pricing.lineItems ?? [],
          appliedCoupon: data.pricing.appliedCoupon
            ? { code: data.pricing.appliedCoupon.code, amount: data.pricing.appliedCoupon.amount }
            : null,
          totalSavings: data.pricing.totalSavings,
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setCouponError(err?.message ?? "Failed to load pricing.");
      })
      .finally(() => {
        if (mounted) setPricingLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [cart?.id, cartStatus]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    setCouponMessage(null);
    try {
      const data = await cartApi.applyCoupon(couponCode.trim());
      dispatch(setCart(data.cart));
      setPricing({
        originalPrice: data.pricing.originalPrice,
        discountedPrice: data.pricing.discountedPrice,
        lineItems: data.pricing.lineItems ?? [],
        appliedCoupon: data.pricing.appliedCoupon
          ? { code: data.pricing.appliedCoupon.code, amount: data.pricing.appliedCoupon.amount }
          : null,
        totalSavings: data.pricing.totalSavings,
      });
      setCouponMessage("Coupon applied successfully.");
      setCouponCode("");
    } catch (err: any) {
      setCouponError(err?.message ?? "Failed to apply coupon.");
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponError(null);
    setCouponMessage(null);
    try {
      const data = await cartApi.removeCoupon();
      dispatch(setCart(data.cart));
      setPricing({
        originalPrice: data.pricing.originalPrice,
        discountedPrice: data.pricing.discountedPrice,
        lineItems: data.pricing.lineItems ?? [],
        appliedCoupon: data.pricing.appliedCoupon
          ? { code: data.pricing.appliedCoupon.code, amount: data.pricing.appliedCoupon.amount }
          : null,
        totalSavings: data.pricing.totalSavings,
      });
      setCouponMessage("Coupon removed.");
    } catch (err: any) {
      setCouponError(err?.message ?? "Failed to remove coupon.");
    }
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
                      <div className='mt-1 text-sm text-zinc-600'>
                        {(() => {
                          const line = getLinePricing(i.id);
                          const hasDiscount = line && line.discountedUnitPrice < line.originalUnitPrice;
                          return hasDiscount ? (
                            <>
                              <span className='line-through text-zinc-400'>{formatPrice(line.originalUnitPrice)}</span>
                              <span className='ml-2'>{formatPrice(line.discountedUnitPrice)}</span>
                            </>
                          ) : (
                            formatPrice(i.priceSnapshot)
                          );
                        })()}
                      </div>
                      <p className='mt-0.5 text-xs text-zinc-400'>SKU: {i.variant?.sku}</p>

                    </div>
                  </div>
                  <div className='flex flex-col items-start'>
                    <QuantitySelector
                      value={i.quantity}
                      min={1}
                      max={i.variant?.stock ?? 1}
                      onChange={(quantity) => dispatch(updateQuantity({ itemId: i.id, quantity }))}

                      gapClassName="gap-1"
                      buttonSizeClassName="h-6 w-6"
                      buttonClassName="bg-[#f2f2f2] text-zinc-900 border-none rounded-none"
                      valueSizeClassName="text-sm text-zinc-900"
                      containerClassName="mt-0 bg-[#f2f2f2] border border-zinc-300 rounded-none p-1"
                      />
                  </div>
                  <div className='text-base font-medium text-zinc-900'>
                    {(() => {
                      const line = getLinePricing(i.id);
                      const rowTotal = line ? line.lineTotal : i.priceSnapshot * i.quantity;
                      return formatPrice(rowTotal);
                    })()}
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
                {formatPrice(discountedTotal)}
              </p>
              {pricingLoading ? (
                <p className='mt-1 text-xs text-zinc-500'>Calculating discounts...</p>
              ) : null}
              <div className='mt-4 rounded border border-zinc-200 p-3'>
                <p className='text-sm font-medium text-zinc-900'>Coupon</p>
                {appliedCouponCode ? (
                  <div className='mt-2 flex items-center justify-between text-sm'>
                    <span className='text-zinc-700'>{appliedCouponCode}</span>
                    <Button variant='ghost' className='h-8 px-2' onClick={handleRemoveCoupon}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className='mt-2 flex gap-2'>
                    <Input
                      placeholder='Enter coupon'
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={hasAppliedCoupon}
                    />
                    <Button type='button' onClick={handleApplyCoupon} disabled={hasAppliedCoupon || !couponCode.trim()}>
                      Apply
                    </Button>
                  </div>
                )}
                {couponMessage ? <p className='mt-2 text-xs text-emerald-600'>{couponMessage}</p> : null}
                {couponError ? <p className='mt-2 text-xs text-red-600'>{couponError}</p> : null}
              </div>
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
