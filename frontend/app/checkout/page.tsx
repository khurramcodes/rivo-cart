"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShippingAddressForm, type AddressFormValues } from "@/components/user/AddressForm";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCartServer } from "@/store/cartThunks";
import { orderApi } from "@/services/orderApi";
import { cartApi } from "@/services/cartApi";
import { shippingApi, type ShippingQuote } from "@/services/shippingApi";
import { formatPrice } from "@/config/currency";
import { addAddress, fetchAddresses, updateAddress } from "@/store/slices/addressSlice";
import type { Address } from "@/types";

const schema = z.object({
  customerName: z.string().min(3, "Name must be at least 3 characters."),
  customerEmail: z.email("Invalid email address"),
  paymentMethod: z.enum(["COD"]),
});

type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.cart.cart);
  const items = cart?.items ?? [];

  const user = useAppSelector((s) => s.auth.user);
  const addresses = useAppSelector((s) => s.addresses.items);
  const addressStatus = useAppSelector((s) => s.addresses.status);

  const total = items.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);
  const subtotal = total;
  const [pricing, setPricing] = useState<{
    discountedPrice: number;
    totalSavings: number;
    appliedCoupon: { code: string; amount: number } | null;
  } | null>(null);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string | null>(null);

  const formatVariantDetails = (attrs: { name: string; value: string }[] | undefined) =>
    attrs && attrs.length > 0 ? attrs.map((attr) => `${attr.name}: ${attr.value}`).join(", ") : "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      paymentMethod: "COD",
    },
  });

  const defaultAddress = useMemo(() => addresses.find((address) => address.isDefault) ?? null, [addresses]);
  const [activeAddress, setActiveAddress] = useState<Address | null>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const itemsSignature = useMemo(
    () => items.map((i) => `${i.id}:${i.quantity}`).join(","),
    [items],
  );

  const selectedQuote = useMemo(
    () => shippingQuotes.find((q) => q.method.id === selectedShippingMethodId) ?? shippingQuotes[0] ?? null,
    [selectedShippingMethodId, shippingQuotes],
  );
  const shippingCost = selectedQuote?.cost ?? 0;

  // Auto-fill form with logged-in user data
  useEffect(() => {
    if (user) {
      form.setValue("customerName", user.name);
      form.setValue("customerEmail", user.email);
    }
  }, [user, form]);


  useEffect(() => {
    if (user && addressStatus === "idle") {
      dispatch(fetchAddresses());
    }
  }, [user, addressStatus, dispatch]);


  useEffect(() => {
    if (!cart?.id) return;
    let mounted = true;
    cartApi
      .getPricing()
      .then((data) => {
        if (!mounted) return;
        setPricing({
          discountedPrice: data.pricing.discountedPrice,
          totalSavings: data.pricing.totalSavings,
          appliedCoupon: data.pricing.appliedCoupon
            ? { code: data.pricing.appliedCoupon.code, amount: data.pricing.appliedCoupon.amount }
            : null,
        });
      })
      .catch(() => {
        if (!mounted) return;
        setPricing(null);
      });
    return () => {
      mounted = false;
    };
  }, [cart?.id, items.length]);

  useEffect(() => {
    if (!activeAddress && defaultAddress) {
      setActiveAddress(defaultAddress);
    }
  }, [activeAddress, defaultAddress]);

  // useEffect(() => {
  //   if (!activeAddress?.id || !cart?.id || items.length === 0) {
  //     setShippingQuotes([]);
  //     setSelectedShippingMethodId(null);
  //     return;
  //   }
  //   let mounted = true;
  //   setShippingError(null);
  //   shippingApi
  //     .quote(activeAddress.id)
  //     .then((data) => {
  //       if (!mounted) return;
  //       setShippingQuotes(data.quotes);
  //       const next = data.quotes[0]?.method.id ?? null;
  //       setSelectedShippingMethodId((current) =>
  //         data.quotes.some((q) => q.method.id === current) ? current : next
  //       );
  //     })
  //     .catch((err) => {
  //       if (!mounted) return;
  //       setShippingQuotes([]);
  //       setSelectedShippingMethodId(null);
  //       setShippingError(err?.message ?? "Failed to load shipping options.");
  //     });
  //   return () => {
  //     mounted = false;
  //   };
  // }, [activeAddress?.id, cart?.id, itemsSignature, cart?.appliedCouponId]);


  useEffect(() => {
    if (!activeAddress?.id) return;
    if (!cart?.id) return;
    if (items.length === 0) return;

    let mounted = true;
    setShippingError(null);

    shippingApi
      .quote(activeAddress.id)
      .then((data) => {
        if (!mounted) return;

        setShippingQuotes(data.quotes);

        const next = data.quotes[0]?.method.id ?? null;

        setSelectedShippingMethodId((current) =>
          data.quotes.some((q) => q.method.id === current)
            ? current
            : next
        );
      })
      .catch((err) => {
        if (!mounted) return;

        setShippingQuotes([]);
        setSelectedShippingMethodId(null);
        setShippingError(
          err?.message ?? "Failed to load shipping options."
        );
      });

    return () => {
      mounted = false;
    };
  }, [activeAddress?.id, cart?.id, itemsSignature, cart?.appliedCouponId]);

  const formatShippingAddress = (address: Address) => {
    const line = [
      address.streetAddress,
      address.city,
      address.state,
      address.country,
      address.postalCode ? address.postalCode : null,
    ]
      .filter(Boolean)
      .join(", ");
    return line;
  };

  const handleAddressSubmit = async (values: AddressFormValues) => {
    if (!user) return;
    setAddressError(null);
    setAddressMessage(null);

    const fullName = defaultAddress?.fullName ?? user.name;

    try {
      if (defaultAddress) {
        const updated = await dispatch(
          updateAddress({
            id: defaultAddress.id,
            updates: { ...values, fullName },
          })
        ).unwrap();
        setActiveAddress(updated);
        setAddressMessage("Shipping address updated.");
      } else {
        const created = await dispatch(addAddress({ ...values, fullName })).unwrap();
        setActiveAddress(created);
        setAddressMessage("Shipping address saved.");
      }
    } catch (error) {
      setAddressError(typeof error === "string" ? error : "Failed to save shipping address.");
    }
  };

  async function onSubmit(values: FormValues) {
    setOrderError(null);
    if (!activeAddress) {
      setOrderError("Please save your shipping address before placing the order.");
      return;
    }

    try {
      const order = await orderApi.place({
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: activeAddress.phone,
        shippingAddress: formatShippingAddress(activeAddress),
        shippingAddressId: activeAddress.id,
        shippingMethodId: selectedQuote?.method.id ?? undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity
        })),
      });
      await dispatch(clearCartServer());
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (error: any) {
      setOrderError(error?.response?.data?.error?.message || "Failed to place order. Please try again.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-2xl px-4 py-10">
          <p className="text-sm text-zinc-600">Your cart is empty.</p>
          <Link href="/products" className="mt-3 inline-block text-sm text-zinc-900 underline underline-offset-4">
            Browse products
          </Link>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Checkout</h1>
          <p className="mt-2 text-sm text-zinc-600">Please login to place your order.</p>
          <Link href="/login" className="mt-4 inline-block">
            <Button>Login</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Checkout</h1>
        <p className="mt-1 text-sm text-zinc-600">Complete your order details below</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <form className="lg:col-span-2 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Customer Information Section */}
            <div className="rounded border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Customer Information</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-800">Full name</label>
                  <Input className="mt-2" {...form.register("customerName")} />
                  {form.formState.errors.customerName ? (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.customerName.message}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-800">Email</label>
                  <Input className="mt-2" type="email" {...form.register("customerEmail")} />
                  {form.formState.errors.customerEmail ? (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.customerEmail.message}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="rounded border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Shipping Address</h2>
              <div className="mt-4 space-y-3">
                <ShippingAddressForm
                  initialValues={
                    activeAddress ?? defaultAddress
                      ? {
                          ...(activeAddress ?? defaultAddress ?? {}),
                          fullName: undefined,
                        }
                      : undefined
                  }
                  fullNameValue={form.watch("customerName") || user?.name || ""}
                  submitLabel="Save shipping address"
                  onSubmit={handleAddressSubmit}
                />
                {addressError ? <p className="text-sm text-red-600">{addressError}</p> : null}
                {addressMessage ? <p className="text-sm text-emerald-600">{addressMessage}</p> : null}
              </div>
            </div>

            {/* Shipping Method Section */}
            <div className="rounded border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Shipping Method</h2>
              <div className="mt-4 space-y-3">
                {shippingQuotes.length === 0 ? (
                  <p className="text-sm text-zinc-600">No shipping options available.</p>
                ) : (
                  shippingQuotes.map((quote) => (
                    <label key={quote.method.id} className="flex items-center justify-between gap-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={quote.method.id}
                          checked={selectedQuote?.method.id === quote.method.id}
                          onChange={() => setSelectedShippingMethodId(quote.method.id)}
                          className="h-4 w-4 border-zinc-300 text-black focus:ring-black"
                        />
                        <div>
                          <span className="text-sm font-medium text-zinc-900">{quote.method.name}</span>
                          {quote.method.description ? (
                            <p className="text-xs text-zinc-500">{quote.method.description}</p>
                          ) : null}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-zinc-900">{formatPrice(quote.cost)}</span>
                    </label>
                  ))
                )}
                {shippingError ? <p className="text-sm text-red-600">{shippingError}</p> : null}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="rounded border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Payment Method</h2>
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="COD"
                    {...form.register("paymentMethod")}
                    className="h-4 w-4 border-zinc-300 text-black focus:ring-black"
                  />
                  <div>
                    <span className="text-sm font-medium text-zinc-900">Cash on Delivery</span>
                    <p className="text-xs text-zinc-500">Pay when you receive your order</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Placing order..." : "Place order"}
              </Button>
              {orderError ? <p className="text-sm text-red-600">{orderError}</p> : null}
            </div>
          </form>

          <aside className="rounded border border-zinc-200 p-6 h-fit">
            <h2 className="text-lg font-semibold text-zinc-900">Order Summary</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4"
                >
                  {/* Product Image */}
                  <div className="relative shrink-0 w-16 h-16 rounded-lg border border-zinc-200 bg-white overflow-hidden">
                    <img
                      src={item.product?.imageUrl ?? "/images/logo.png"}
                      alt={item.product?.name ?? "Product"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-zinc-900 truncate">
                      {item.product?.name ?? "Product"}
                    </h3>
                    {formatVariantDetails(item.variant?.attributes) ? (
                      <p className="text-xs text-zinc-500 my-0.5">
                        {formatVariantDetails(item.variant?.attributes)}
                      </p>
                    ) : null}

                    {/* Quantity Badge */}
                    <div className="text-zinc-500 text-xs">
                      Qty: {item.quantity}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-sm font-medium text-zinc-900">
                    {formatPrice(item.priceSnapshot * item.quantity)}
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-zinc-200"></div>

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Subtotal</span>
                  <span className="text-zinc-900">{formatPrice(subtotal)}</span>
                </div>
                {pricing?.appliedCoupon ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Coupon ({pricing.appliedCoupon.code})</span>
                    <span className="text-emerald-600">- {formatPrice(pricing.appliedCoupon.amount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Shipping</span>
                  <span className="text-zinc-900">
                    {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-200"></div>

              {/* Total */}
              <div className="flex justify-between items-baseline">
                <span className="text-base font-semibold text-zinc-900">Total</span>
                <div className="text-right">
                  <div className="text-xl font-semibold text-zinc-900">
                    {formatPrice((pricing?.discountedPrice ?? total) + shippingCost)}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}