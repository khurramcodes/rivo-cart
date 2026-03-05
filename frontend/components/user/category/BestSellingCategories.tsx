"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BestSellingCategory } from "@/types";
import { catalogApi } from "@/services/catalogApi";

interface BestSellingCategoriesProps {
  limit?: number;
}

export function BestSellingCategories({ limit = 6 }: BestSellingCategoriesProps) {
  const [items, setItems] = useState<BestSellingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await catalogApi.listBestSellingCategories(limit);
        if (!mounted) return;

        console.log(data);
        setItems(data.items);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [limit]);

  if (loading && items.length === 0) return <div className="text-sm text-zinc-600">Loading…</div>;
  if (!loading && items.length === 0) return null;

  return (
    <section className="w-full py-28">
      <h2 className="pb-12 text-4xl text-accent font-medium">Top Categories</h2>

      {/* Mobile: horizontal scroll */}
      <div className="flex gap-6 overflow-x-auto pb-2 md:hidden [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-zinc-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300">
        {items.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group flex shrink-0 flex-col items-center text-center"
          >
            <div className="relative h-32 w-32 overflow-hidden rounded-full">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-500">
                  No Image
                </div>
              )}
            </div>
            <p className="mt-4 w-28 text-sm font-medium text-zinc-800 transition-colors group-hover:text-primary">
              {category.name} ( {category.productCount} )
            </p>
          </Link>
        ))}
      </div>

      {/* md and up: grid layout */}
      <div className="hidden grid-cols-2 gap-8 md:grid md:grid-cols-3 lg:grid-cols-4">
        {items.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group flex flex-col items-center text-center"
          >
            <div className="relative h-32 w-32 overflow-hidden rounded-full md:h-60 md:w-60">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-500">
                  No Image
                </div>
              )}
            </div>
            <p className="mt-4 text-base font-medium text-zinc-800 transition-colors group-hover:text-primary">
              {category.name}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {category.soldQuantity} sold · {category.productCount} products
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
