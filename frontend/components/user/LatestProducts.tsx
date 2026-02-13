"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Product } from "@/types";
import { catalogApi } from "@/services/catalogApi";
import { pricingApi, type VariantPricing } from "@/services/pricingApi";
import { formatPrice } from "@/config/currency";
import { useAppDispatch } from "@/store/hooks";
import { ProductCard } from "./ProductCard";

/**
 * Latest products section props
 * (kept extensible for future use)
 */
interface LatestProductsProps {
  limit?: number;
}

export function LatestProducts({ limit = 6 }: LatestProductsProps) {
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pricingMap, setPricingMap] = useState<Map<string, VariantPricing>>(
    new Map(),
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await catalogApi.listLatestProducts(limit);
        if (!mounted) return;

        const limitedProducts = limit ? data.items.slice(0, limit) : data.items;
        setProducts(limitedProducts);

        // Fetch pricing for all default variants
        const variantIds = limitedProducts
          .map((p) => getDefaultVariant(p)?.id)
          .filter((id): id is string => !!id);

        if (variantIds.length > 0) {
          const pricingResults =
            await pricingApi.getBulkVariantPricing(variantIds);
          if (!mounted) return;
          const newMap = new Map<string, VariantPricing>();
          pricingResults.forEach((r) => {
            if (r.pricing) newMap.set(r.variantId, r.pricing);
          });
          setPricingMap(newMap);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [limit]);

  /**
   * Resolve product price or price range
   */
  function getProductPrice(product: Product): {
    price: number;
    priceRange?: string;
  } {
    if (!product.variants || product.variants.length === 0) {
      return { price: 0 };
    }

    const prices = product.variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (product.type === "VARIABLE" && minPrice !== maxPrice) {
      return {
        price: minPrice,
        priceRange: `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`,
      };
    }

    const defaultVariant =
      product.variants.find((v) => v.isDefault) || product.variants[0];

    return { price: defaultVariant.price };
  }

  /**
   * Resolve default variant for cart action
   */
  function getDefaultVariant(product: Product) {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => v.isDefault) || product.variants[0];
  }

  if (loading && products.length === 0) {
    return <div className='text-sm text-zinc-600'>Loading…</div>;
  }

  if (!loading && products.length === 0) {
    return <p className='text-sm text-zinc-600'>No products found.</p>;
  }

  return (
    <section className='w-full py-12'>
      <h2 className='text-center text-4xl font-normal tracking-tight text-zinc-900 mb-8'>
        Latest Products
      </h2>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {products.map((product) => {
          const defaultVariant = getDefaultVariant(product);
          const pricing = defaultVariant
            ? pricingMap.get(defaultVariant.id)
            : null;

          return (
            <ProductCard key={product.id} product={product} pricing={pricing} />
          );
        })}
      </div>

      <div className='text-center mt-8'>
        <Link
          href='/products'
          className='inline-flex items-center justify-center rounded bg-zinc-900 px-6 py-3 text-base font-medium text-white transition hover:bg-black'>
          View All Products
        </Link>
      </div>
    </section>
  );
}
