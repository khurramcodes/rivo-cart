"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/config/currency";
import { addCacheBust } from "@/utils/imageCache";
import type { Product } from "@/types";
import type { VariantPricing } from "@/services/pricingApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart } from "@/store/cartThunks";
import { toggleWishlist } from "@/store/slices/wishlistSlice";
import { StarRating } from "@/components/ui/StarRating";
import { Heart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  pricing?: VariantPricing | null;
  label?: string;
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

export function ProductCard({ product, pricing, label }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const wishlistIds = useAppSelector((s) => s.wishlist.productIds);
  const isWishlisted = wishlistIds.includes(product.id);
  const defaultVariant = getDefaultVariant(product);

  const priceData = getDisplayPricing(product, pricing);
  if (!priceData) return null;

  const ratingAverage = product.ratingAverage ?? 0;
  const ratingCount = product.ratingCount ?? 0;

  const handleToggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    void dispatch(toggleWishlist(productId));
  };

  return (
    <div className='group rounded shadow bg-white transition'>
      <Link href={`/products/${product.id}`}>
        <div className='relative aspect-square overflow-hidden rounded-t bg-zinc-100'>
          <Image
            src={addCacheBust(product.imageUrl, product.updatedAt)}
            alt={product.name}
            fill
            className='object-contain bg-white transition group-hover:scale-[1.02]'
          />
          {label ? (
            <div className='absolute top-2 left-2 z-10'>
              <p className='text-xs text-white bg-primary rounded-full px-2 py-1'>{label}</p>
            </div>
          ) : null}

          <div
            className='absolute top-2 right-2 z-10 cursor-pointer'
            onClick={(e) => handleToggleWishlist(e, product.id)}>
            <Heart
              className={`h-7 w-7 transition-colors duration-300 ${
                isWishlisted
                  ? "fill-primary text-primary"
                  : "text-primary hover:fill-primary"
              }`}
            />
          </div>
        </div>

        <div className='mt-3 p-3'>
          <p className='text-base font-medium text-zinc-900 line-clamp-1'>{product.name}</p>

          <div className='mt-1 flex items-center gap-2'>
            <StarRating value={ratingAverage} />
            <span className='text-xs text-zinc-600'>
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
      <div className='p-3'>
        {product.type === "SIMPLE" && defaultVariant ? (
          <Button
            rounded='full'
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
            <Button rounded='full' variant='secondary' className='mt-3 w-full'>
              Select Options
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
