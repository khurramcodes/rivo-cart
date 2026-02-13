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

interface ProductCardProps {
  product: Product;
  pricing?: VariantPricing | null;
}

function getDefaultVariant(product: Product) {
  if (!product.variants?.length) return null;
  return product.variants.find((v) => v.isDefault) || product.variants[0];
}

function getProductPrice(product: Product) {
  if (!product.variants?.length) return 0;
  const defaultVariant =
    product.variants.find((v) => v.isDefault) || product.variants[0];
  return defaultVariant.price;
}

export function ProductCard({ product, pricing }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const defaultVariant = getDefaultVariant(product);
  const basePrice = getProductPrice(product);

  const hasDiscount = pricing && pricing.totalSavings > 0;

  return (
    <div className='group rounded border border-zinc-200 bg-white p-4 transition hover:border-zinc-300'>
      <Link href={`/products/${product.id}`}>
        <div className='relative aspect-square overflow-hidden rounded bg-zinc-100'>
          <Image
            src={addCacheBust(product.imageUrl, product.updatedAt)}
            alt={product.name}
            fill
            className='object-cover transition group-hover:scale-[1.02]'
          />
        </div>

        <div className='mt-3'>
          <p className='text-sm font-medium text-zinc-900'>{product.name}</p>

          <div className='mt-1'>
            {hasDiscount ? (
              <div className='flex items-center gap-2'>
                <p className='text-sm text-zinc-400 line-through'>
                  {formatPrice(basePrice)}
                </p>
                <p className='text-sm font-semibold text-zinc-900'>
                  {formatPrice(pricing!.discountedPrice)}
                </p>
                <p className='text-xs bg-red-800 text-white py-1 px-3 rounded-2xl'>
                  {pricing.totalPercentageSavings}% Off
                </p>
              </div>
            ) : (
              <p className='text-sm text-zinc-600'>{formatPrice(basePrice)}</p>
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
