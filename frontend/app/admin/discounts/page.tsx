"use client";

import { useState } from "react";
import { DiscountSection } from "@/components/admin/discounts/DiscountSection";
import { CouponSection } from "@/components/admin/discounts/CouponSection";

type TabKey = "discounts" | "coupons";

export default function AdminDiscountsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("discounts");

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-zinc-900'>
            Discounts & Coupons
          </h1>
          <p className='text-sm text-zinc-600'>
            Manage promotions across products and carts.
          </p>
        </div>
        <div className='flex gap-2 rounded border border-zinc-200 bg-white p-1 text-sm'>
          <button
            type='button'
            onClick={() => setActiveTab("discounts")}
            className={`rounded px-3 py-1.5 ${
              activeTab === "discounts"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600"
            }`}>
            Discounts
          </button>
          <button
            type='button'
            onClick={() => setActiveTab("coupons")}
            className={`rounded px-3 py-1.5 ${
              activeTab === "coupons"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600"
            }`}>
            Coupons
          </button>
        </div>
      </div>

      {activeTab === "discounts" ? <DiscountSection /> : <CouponSection />}
    </div>
  );
}
