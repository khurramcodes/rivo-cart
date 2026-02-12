"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import type { Product } from "@/types";
import { catalogApi } from "@/services/catalogApi";
import { pricingApi, type VariantPricing } from "@/services/pricingApi";
import { formatPrice } from "@/config/currency";
import { addCacheBust } from "@/utils/imageCache";
import { Button } from "@/components/ui/Button";
import { useAppDispatch } from "@/store/hooks";
import { addToCart } from "@/store/cartThunks";
import { Tag } from "lucide-react";

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
  const [pricingMap, setPricingMap] = useState<Map<string, VariantPricing>>(new Map());

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
          const pricingResults = await pricingApi.getBulkVariantPricing(variantIds);
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
      <h2 className='text-center text-4xl font-medium tracking-tight text-zinc-900 mb-8'>
        Latest Products
      </h2>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {products.map((product) => {
          const priceInfo = getProductPrice(product);
          const defaultVariant = getDefaultVariant(product);
          const pricing = defaultVariant ? pricingMap.get(defaultVariant.id) : null;
          const hasDiscount = pricing && pricing.totalSavings > 0;

          return (
            <div
              key={product.id}
              className='group rounded border border-zinc-200 bg-white p-4 transition hover:border-zinc-300'>
              <Link href={`/products/${product.id}`}>
                {product.imageUrl && (
                  <div className='relative aspect-square overflow-hidden rounded bg-zinc-100'>
                    <Image
                      src={addCacheBust(product.imageUrl, product.updatedAt)}
                      alt={product.name}
                      fill
                      className='object-cover transition group-hover:scale-[1.02]'
                      unoptimized
                    />
                  </div>
                )}

                <div className='mt-3'>
                  <p className='text-sm font-medium text-zinc-900'>
                    {product.name}
                  </p>
                  <div className="mt-1">
                    {hasDiscount ? (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-zinc-400 line-through">
                          {priceInfo.priceRange || formatPrice(priceInfo.price)}
                        </p>
                        <p className="text-sm font-semibold text-zinc-900">
                          {formatPrice(pricing.discountedPrice)}
                        </p>
                        <p className="text-xs bg-red-800 text-white py-1 px-3 rounded-2xl">
                          {pricing.totalPercentageSavings}% Off
                        </p>
                      </div>
                    ) : (
                      <p className='text-sm text-zinc-600'>
                        {priceInfo.priceRange || formatPrice(priceInfo.price)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>

              {product.type === "SIMPLE" && defaultVariant ? (
                <Button
                  variant='primary'
                  className='mt-3 w-full'
                  disabled={defaultVariant.stock === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(
                      addToCart({
                        product,
                        variant: defaultVariant,
                        quantity: 1,
                      })
                    );
                  }}>
                  {defaultVariant.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
              ) : (
                <Link href={`/products/${product.id}`} className="block">
                  <Button variant='secondary' className='mt-3 w-full'>
                    Select Options
                  </Button>
                </Link>
              )}
            </div>
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
