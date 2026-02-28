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
    <section className="w-full py-12">
      <h2 className="mb-8 text-center text-4xl font-normal tracking-tight text-zinc-900">Top Categories</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group relative min-h-[140px] overflow-hidden rounded border border-zinc-200 transition hover:border-zinc-300"
          >
            {category.imageUrl ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url(${category.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-black/50" aria-hidden />
              </>
            ) : null}
            <div className="relative flex min-h-[140px] flex-col justify-end p-5">
              <p
                className={`text-lg font-medium ${category.imageUrl ? "text-white drop-shadow-md" : "text-zinc-900"}`}
              >
                {category.name}
              </p>
              <p
                className={`mt-1 text-sm ${category.imageUrl ? "text-white/90 drop-shadow-sm" : "text-zinc-600"}`}
              >
                Sold items: {category.soldQuantity}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
