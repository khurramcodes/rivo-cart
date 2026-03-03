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
    <section className='w-full py-28'>
      <h2 className='pb-12 text-4xl text-accent font-medium'>Top Categories</h2>

      <div className='grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4'>
        {items.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className='group flex flex-col items-center text-center'>
            {/* Circular Image */}
            <div className='relative h-32 w-32 md:h-60 md:w-60 overflow-hidden rounded-full'>
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-110'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-500'>
                  No Image
                </div>
              )}
            </div>

            {/* Category Name + Count */}
            <p className='mt-4 text-base font-medium text-zinc-800 transition-colors group-hover:text-primary'>
              {category.name} ({category.soldQuantity})
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
