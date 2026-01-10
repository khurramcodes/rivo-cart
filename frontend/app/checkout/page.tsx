"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCart } from "@/store/slices/cartSlice";
import { orderApi } from "@/services/orderApi";
import { formatPrice } from "@/config/currency";

const schema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(6, "Phone must be at least 6 characters"),
  shippingAddress: z.string().min(5, "Address must be at least 5 characters"),
  paymentMethod: z.enum(["COD"]),
});

type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const user = useAppSelector((s) => s.auth.user);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { 
      customerName: "", 
      customerEmail: "",
      customerPhone: "", 
      shippingAddress: "",
      paymentMethod: "COD",
    },
  });

  // Auto-fill form with logged-in user data
  useEffect(() => {
    if (user) {
      form.setValue("customerName", user.name);
      form.setValue("customerEmail", user.email);
    }
  }, [user, form]);

  async function onSubmit(values: FormValues) {
    try {
      const order = await orderApi.place({
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        shippingAddress: values.shippingAddress,
        items: items.map((i) => ({ 
          productId: i.productId, 
          variantId: i.variantId,
          quantity: i.quantity 
        })),
      });
      dispatch(clearCart());
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to place order. Please try again.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
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
        <NavBar />
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
      <NavBar />
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
                <div>
                  <label className="text-sm font-medium text-zinc-800">Phone</label>
                  <Input className="mt-2" {...form.register("customerPhone")} />
                  {form.formState.errors.customerPhone ? (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.customerPhone.message}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="rounded border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Shipping Address</h2>
              <div className="mt-4">
                <label className="text-sm font-medium text-zinc-800">Address</label>
                <Input className="mt-2" {...form.register("shippingAddress")} placeholder="Street address, city, postal code" />
                {form.formState.errors.shippingAddress ? (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.shippingAddress.message}</p>
                ) : null}
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

            <Button type="submit" className="w-full">
              Place order
            </Button>
          </form>

          <aside className="rounded border border-zinc-200 p-6 h-fit">
            <h2 className="text-lg font-semibold text-zinc-900">Order Summary</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-zinc-600">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-zinc-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-zinc-900">Total</span>
                <span className="text-2xl font-semibold text-zinc-900">{formatPrice(total)}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-500">Your order will be confirmed by the admin.</p>
          </aside>
        </div>
      </main>
    </div>
  );
}


