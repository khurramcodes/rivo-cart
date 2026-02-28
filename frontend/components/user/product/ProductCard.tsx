"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/config/currency";
import { addCacheBust } from "@/utils/imageCache";
import type { Product } from "@/types";
import type { VariantPricing } from "@/services/pricingApi";
import { useAppDispatch } from "@/store/hooks";
import { addToCart } from "@/store/cartThunks";
import { StarRating } from "@/components/ui/StarRating";

interface ProductCardProps {
  product: Product;
  pricing?: VariantPricing | null;
}

function getDefaultVariant(product: Product) {
  if (!product.variants?.length) return null;
  return product.variants.find((v) => v.isDefault) || product.variants[0];
}


function getDisplayPricing(product: Product, pricing?: VariantPricing | null) {
  if (!product.variants?.length) {
    return null;
  }

  const prices = product.variants.map((v) => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const isVariable = product.type === "VARIABLE";
  const isRange = minPrice !== maxPrice;

  // SIMPLE PRODUCT
  if (!isVariable) {
    const defaultVariant =
      product.variants.find((v) => v.isDefault) || product.variants[0];

    return {
      originalMin: defaultVariant.price,
      originalMax: defaultVariant.price,
      discountedMin: pricing?.discountedPrice ?? defaultVariant.price,
      hasDiscount: pricing ? pricing.totalSavings > 0 : false,
      percentage: pricing?.totalPercentageSavings ?? 0,
      isRange: false,
      isVariable: false,
    };
  }

  // VARIABLE PRODUCT
  return {
    originalMin: minPrice,
    originalMax: maxPrice,
    discountedMin: pricing?.discountedPrice ?? minPrice,
    hasDiscount: pricing ? pricing.totalSavings > 0 : false,
    percentage: pricing?.totalPercentageSavings ?? 0,
    isRange,
    isVariable: true,
  };
}

export function ProductCard({ product, pricing }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const defaultVariant = getDefaultVariant(product);

  const priceData = getDisplayPricing(product, pricing);
  if (!priceData) return null;

  const ratingAverage = product.ratingAverage ?? 0;
  const ratingCount = product.ratingCount ?? 0;

  return (
    <div className='group rounded border border-zinc-200 bg-white p-4 transition hover:border-zinc-300'>
      <Link href={`/products/${product.id}`}>
        <div className='relative aspect-square overflow-hidden rounded bg-zinc-100'>
          <Image
            src={addCacheBust(product.imageUrl, product.updatedAt)}
            alt={product.name}
            fill
            className='object-contain bg-white transition group-hover:scale-[1.02]'
          />
        </div>

        <div className='mt-3'>
          <p className='text-sm font-medium text-zinc-900'>{product.name}</p>

          <div className="mt-1 flex items-center gap-2">
            <StarRating value={ratingAverage} />
            <span className="text-xs text-zinc-600">
              {ratingAverage.toFixed(1)} ({ratingCount})
            </span>
          </div>

          <div className='mt-1'>
            {priceData.hasDiscount ? (
              <div className='flex flex-col gap-1'>
                {/* Original Price */}
                <p className='text-sm text-zinc-400 line-through'>
                  {priceData.isRange && priceData.isVariable
                    ? `${formatPrice(priceData.originalMin)} – ${formatPrice(priceData.originalMax)}`
                    : formatPrice(priceData.originalMin)}
                </p>

                {/* Discounted Price */}
                <div className='flex items-center gap-2'>
                  <p className='text-sm font-semibold text-zinc-900'>
                    {priceData.isRange && priceData.isVariable
                      ? `From ${formatPrice(priceData.discountedMin)}`
                      : formatPrice(priceData.discountedMin)}
                  </p>

                  <p className='text-xs bg-red-800 text-white py-1 px-3 rounded-2xl'>
                    {priceData.percentage}% Off
                  </p>
                </div>
              </div>
            ) : (
              <p className='text-sm text-zinc-600'>
                {priceData.isRange && priceData.isVariable
                  ? `${formatPrice(priceData.originalMin)} – ${formatPrice(priceData.originalMax)}`
                  : formatPrice(priceData.originalMin)}
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
              }),
            );
          }}>
          {defaultVariant.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      ) : (
        <Link href={`/products/${product.id}`}>
          <Button variant='secondary' className='mt-3 w-full'>
            Select Options
          </Button>
        </Link>
      )}
    </div>
  );
}
