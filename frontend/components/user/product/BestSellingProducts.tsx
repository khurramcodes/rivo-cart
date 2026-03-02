"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BestSellingProduct, Product } from "@/types";
import { catalogApi } from "@/services/catalogApi";
import { pricingApi, type VariantPricing } from "@/services/pricingApi";
import { ProductCard } from "./ProductCard";

interface BestSellingProductsProps {
  limit?: number;
}

function getDefaultVariant(product: Product) {
  if (!product.variants || product.variants.length === 0) return null;
  return product.variants.find((v) => v.isDefault) || product.variants[0];
}

export function BestSellingProducts({ limit = 8 }: BestSellingProductsProps) {
  const [items, setItems] = useState<BestSellingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricingMap, setPricingMap] = useState<Map<string, VariantPricing>>(new Map());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await catalogApi.listBestSellingProducts(limit);
        if (!mounted) return;
        setItems(data.items);

        const variantIds = data.items
          .map((p) => getDefaultVariant(p)?.id)
          .filter((id): id is string => Boolean(id));
        if (variantIds.length > 0) {
          const pricingResults = await pricingApi.getBulkVariantPricing(variantIds);
          if (!mounted) return;
          const next = new Map<string, VariantPricing>();
          pricingResults.forEach((row) => {
            if (row.pricing) next.set(row.variantId, row.pricing);
          });
          setPricingMap(next);
        }
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
      <div className='flex justify-between items-center pb-12'>
        <h2 className='text-4xl text-accent font-medium'>Best Sellers</h2>
        <div>
          <Link
            href='/products'
            className='text-lg text-accent underline font-medium transition hover:text-primary'>
            View All
          </Link>
        </div>
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {items.map((product) => {
          const defaultVariant = getDefaultVariant(product);
          const pricing = defaultVariant
            ? pricingMap.get(defaultVariant.id)
            : null;
          return (
            <div key={product.id}>
              <ProductCard product={product} pricing={pricing} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
