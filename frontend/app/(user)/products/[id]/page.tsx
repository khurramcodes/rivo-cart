"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { catalogApi } from "@/services/catalogApi";
import { pricingApi, type VariantPricing } from "@/services/pricingApi";
import type { Product, ProductVariant } from "@/types";
import { formatPrice } from "@/config/currency";
import { Button } from "@/components/ui/Button";
import { useAppDispatch } from "@/store/hooks";
import { addToCart } from "@/store/cartThunks";
import { addCacheBust } from "@/utils/imageCache";
import { Minus, Plus, Package, X, CircleCheckBig, Tag } from "lucide-react";
import { QuantitySelector } from "@/components/user/QuantitySelector";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);
  const dispatch = useAppDispatch();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showAddedNotice, setShowAddedNotice] = useState(false);
  const [pricing, setPricing] = useState<VariantPricing | null>(null);

  // Combine main image and gallery images
  const productImages = useMemo(() => {
    if (!product) return [];

    const images: string[] = [];

    // Always include main image first
    if (product.imageUrl) {
      images.push(addCacheBust(product.imageUrl, product.updatedAt));
    }

    // Add gallery images (max 3 more for total of 4)
    if (product.galleryImages && product.galleryImages.length > 0) {
      const galleryUrls = product.galleryImages
        .slice(0, 3)
        .map((img) => addCacheBust(img.url, product.updatedAt));
      images.push(...galleryUrls);
    }

    return images;
  }, [product]);

  // Get the currently selected variant
  const selectedVariant = useMemo(() => {
    if (!product || !product.variants) return null;
    if (selectedVariantId) {
      return product.variants.find((v) => v.id === selectedVariantId) || null;
    }
    // Default to first in-stock variant or first variant
    return product.variants.find((v) => v.isDefault && v.stock > 0) ||
      product.variants.find((v) => v.stock > 0) ||
      product.variants[0] ||
      null;
  }, [product, selectedVariantId]);

  // Group attributes by name for variation selection UI
  const attributeGroups = useMemo(() => {
    if (!product?.variants || product.type === "SIMPLE") return {};

    const groups: Record<string, { name: string; values: Set<string> }> = {};

    product.variants.forEach((variant) => {
      variant.attributes?.forEach((attr) => {
        if (!groups[attr.name]) {
          groups[attr.name] = { name: attr.name, values: new Set() };
        }
        groups[attr.name].values.add(attr.value);
      });
    });

    return groups;
  }, [product]);


  // Track selected attribute values
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Initialize selected attributes when product loads
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      // Find the best default variant: isDefault + in stock, or first in-stock, or just first
      const defaultVariant =
        product.variants.find((v) => v.isDefault && v.stock > 0) ||
        product.variants.find((v) => v.stock > 0) ||
        product.variants.find((v) => v.isDefault) ||
        product.variants[0];

      setSelectedVariantId(defaultVariant.id);

      // Initialize selected attributes from the default variant
      if (defaultVariant.attributes && defaultVariant.attributes.length > 0) {
        const attrs: Record<string, string> = {};
        defaultVariant.attributes.forEach((attr) => {
          attrs[attr.name] = attr.value;
        });
        setSelectedAttributes(attrs);
      }
    }
  }, [product]);

  // Update selected variant when attributes change
  useEffect(() => {
    if (!product || !product.variants || product.type === "SIMPLE") return;

    const matchingVariant = product.variants.find((variant) => {
      if (!variant.attributes) return false;
      return variant.attributes.every((attr) => selectedAttributes[attr.name] === attr.value);
    });

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
    }
  }, [selectedAttributes, product]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await catalogApi.getProduct(id);
        if (mounted) setProduct(p);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Fetch pricing when selected variant changes
  useEffect(() => {
    if (!selectedVariant?.id) {
      setPricing(null);
      return;
    }

    let mounted = true;
    pricingApi
      .getVariantPricing(selectedVariant.id)
      .then((data) => {
        if (mounted) setPricing(data);
      })
      .catch(() => {
        if (mounted) setPricing(null);
      });

    return () => {
      mounted = false;
    };
  }, [selectedVariant?.id]);

  // Handle ESC key for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };

    if (isLightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isLightboxOpen]);

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;

    if (selectedVariant.stock === 0) {
      alert("This variant is out of stock");
      return;
    }

    try {
      await dispatch(addToCart({ product, variant: selectedVariant, quantity })).unwrap();
      setShowAddedNotice(true);
    } catch {
      // handled by cart state
    }
    setQuantity(1);
  };

  const isVariantAvailable = (attrName: string, attrValue: string): boolean => {
    if (!product || !product.variants) return false;

    // Check if there exists at least one variant that:
    // 1. Has this specific attribute value (attrName = attrValue)
    // 2. Matches all OTHER currently selected attributes
    // 3. Has stock > 0
    return product.variants.some((variant) => {
      // Must have stock
      if (variant.stock === 0) return false;

      // Must have the candidate attribute value
      const hasTargetAttribute = variant.attributes?.some(
        (attr) => attr.name === attrName && attr.value === attrValue
      );
      if (!hasTargetAttribute) return false;

      // Must match ALL other selected attributes (excluding the one we're checking)
      const otherSelectedAttributes = Object.entries(selectedAttributes).filter(
        ([name]) => name !== attrName
      );

      // If there are no other selected attributes, this variant is valid
      if (otherSelectedAttributes.length === 0) return true;

      // Check if this variant has ALL the other selected attributes
      return otherSelectedAttributes.every(([name, value]) =>
        variant.attributes?.some((attr) => attr.name === name && attr.value === value)
      );
    });
  };



  return (
    <div className='min-h-screen bg-white'>
      <main className='mx-auto max-w-6xl lg:max-w-7xl px-4 py-10'>
        {showAddedNotice ? (
          <div className='mb-6 flex items-center justify-between gap-4 rounded border border-emerald-200 bg-emerald-100 px-4 py-3'>
            <div className='text-sm text-emerald-800 flex items-center gap-2'>
              <CircleCheckBig size={16} />
              Product successfully added to cart!{" "}
              <Link href='/cart' className='font-medium underline underline-offset-4'>
                View cart
              </Link>
            </div>
            <button
              type='button'
              aria-label='Dismiss'
              onClick={() => setShowAddedNotice(false)}
              className='text-emerald-900 hover:text-emerald-700'
            >
              <X className='h-4 w-4 cursor-pointer' />
            </button>
          </div>
        ) : null}
        {loading ? <div className='text-sm text-zinc-600'>Loading…</div> : null}
        {!loading && !product ? (
          <div className='text-sm text-zinc-600'>Product not found.</div>
        ) : null}
        {product && selectedVariant ? (
          <div className='grid gap-8 lg:grid-cols-2'>
            {/* Product Image Gallery */}
            <div className='flex gap-4'>
              {/* Thumbnails Column */}
              {productImages.length > 1 && (
                <div className='flex flex-col gap-2'>
                  {productImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`
                        relative w-16 h-16 rounded overflow-hidden border-2 transition
                        ${selectedImageIndex === idx
                          ? 'border-black'
                          : 'border-zinc-200 hover:border-zinc-300'
                        }
                      `}
                    >
                      <Image
                        src={imgUrl}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        fill
                        className='object-cover'
                        priority
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div
                className='relative flex-1 aspect-square overflow-hidden rounded border border-zinc-200 bg-zinc-100 cursor-pointer'
                onClick={() => setIsLightboxOpen(true)}
              >
                <Image
                  src={productImages[selectedImageIndex] || productImages[0]}
                  alt={product.name}
                  fill
                  className='object-cover'
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              {/* Category Badge */}
              <div className='mb-2'>
                {product.category ? (
                  <Link
                    href={`/products?categoryId=${product.categoryId}`}
                    className='text-xs font-medium text-zinc-500 uppercase tracking-wider hover:text-black transition'>
                    {product.category.name}
                  </Link>
                ) : null}
              </div>

              {/* Product Name */}
              <h1 className='text-3xl font-semibold tracking-tight text-zinc-800'>
                {product.name}
              </h1>

              {/* Price */}
              <div className='mt-2'>
                {pricing && pricing.totalSavings > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className='text-xl text-zinc-400 line-through'>
                        {formatPrice(pricing.originalPrice)}
                      </p>
                      <p className='text-2xl font-semibold text-red-600'>
                        {formatPrice(pricing.discountedPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <Tag size={14} />
                      <span className="font-medium">You save {formatPrice(pricing.totalSavings)}</span>
                    </div>
                    {pricing.appliedDiscounts.length > 0 && (
                      <p className="text-xs text-zinc-500">
                        {pricing.appliedDiscounts.map((d) => d.name).join(", ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className='text-2xl font-semibold text-zinc-900'>
                    {formatPrice(selectedVariant.price)}
                  </p>
                )}
              </div>

              {/* SKU & Stock Status */}
              <div className='mt-3 flex items-center gap-4 text-sm'>
                <div className='flex items-center gap-1.5 text-zinc-600'>
                  <Package className='h-4 w-4' />
                  <span>SKU: {selectedVariant.sku}</span>
                </div>
                {selectedVariant.stock > 0 ? (
                  <span className='text-green-600 font-medium'>
                    {selectedVariant.stock} in stock
                  </span>
                ) : (
                  <span className='text-red-600 font-medium'>Out of stock</span>
                )}
              </div>

              {/* Description */}
              {product.description ? (
                <p className='mt-4 text-zinc-600'>{product.description}</p>
              ) : null}

              <div className='mt-6 space-y-6'>
                {/* Variation Selectors (for VARIABLE products) */}
                {product.type === "VARIABLE" &&
                  Object.keys(attributeGroups).length > 0 ? (
                  <div className='space-y-4'>
                    {Object.entries(attributeGroups).map(
                      ([attrName, group]) => (
                        <div key={attrName}>
                          <label className='text-sm font-medium text-zinc-800'>
                            {group.name}
                          </label>
                          <div className='mt-2 flex flex-wrap gap-2'>
                            {Array.from(group.values).map((value) => {
                              const isSelected =
                                selectedAttributes[attrName] === value;
                              const isAvailable = isVariantAvailable(
                                attrName,
                                value
                              );

                              return (
                                <button
                                  key={value}
                                  onClick={() =>
                                    setSelectedAttributes({
                                      ...selectedAttributes,
                                      [attrName]: value,
                                    })
                                  }
                                  disabled={!isAvailable}
                                  className={`
                                  px-4 py-2 rounded border text-sm font-medium transition cursor-pointer
                                  ${isSelected
                                      ? "border-black bg-black text-white"
                                      : isAvailable
                                        ? "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300"
                                        : "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed line-through"
                                    }
                                `}>
                                  {value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : null}

                {/* Quantity Selector */}

                <QuantitySelector
                  value={quantity}
                  min={1}
                  max={selectedVariant.stock}
                  onChange={setQuantity}
                  
                  gapClassName="gap-1"
                  buttonSizeClassName="h-10 w-10"
                  buttonClassName="bg-[#f2f2f2] text-zinc-900 border-none rounded-none"
                  valueSizeClassName="text-lg text-zinc-900"
                  containerClassName="mt-0 bg-[#f2f2f2] border border-zinc-300 rounded-none py-0 p-1"

                  />

                {quantity >= selectedVariant.stock &&
                  selectedVariant.stock > 0 ? (
                  <p className='mt-1 text-xs text-amber-600'>
                    Maximum available quantity selected
                  </p>
                ) : null}

                {/* Add to Cart Button */}
                <Button
                  className='w-full'
                  disabled={
                    quantity > selectedVariant.stock &&
                    selectedVariant.stock > 0
                  }
                  onClick={handleAddToCart}>
                  {selectedVariant.stock === 0 ? "Out of Stock" : "Add to cart"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Lightbox */}
        {isLightboxOpen && productImages.length > 0 && (
          <div
            className='fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4'
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className='absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white'
              aria-label='Close lightbox'
            >
              <X size={24} />
            </button>

            {/* Lightbox Image */}
            <div
              className='relative max-w-5xl max-h-[90vh] w-full h-full'
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={productImages[selectedImageIndex]}
                alt={product?.name || 'Product image'}
                fill
                className='object-contain'
                priority
                unoptimized
              />
            </div>

            {/* Image Counter */}
            {productImages.length > 1 && (
              <div className='absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm'>
                {selectedImageIndex + 1} / {productImages.length}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
