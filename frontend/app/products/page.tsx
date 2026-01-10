"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NavBar } from "@/components/user/NavBar";
import { catalogApi } from "@/services/catalogApi";
import { formatPrice } from "@/config/currency";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import type { Category } from "@/types";
import { addCacheBust } from "@/utils/imageCache";
import { Button } from "@/components/ui/Button";
import { useAppDispatch } from "@/store/hooks";
import { addToCart } from "@/store/slices/cartSlice";

// Helper function to get product display price
function getProductPrice(product: Product): { price: number; priceRange?: string } {
  if (!product.variants || product.variants.length === 0) {
    return { price: 0 };
  }

  const prices = product.variants.map((v) => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // If variable product with different prices, show range
  if (product.type === "VARIABLE" && minPrice !== maxPrice) {
    return { price: minPrice, priceRange: `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}` };
  }

  // Otherwise, show default variant price or first variant
  const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0];
  return { price: defaultVariant.price };
}

// Helper to get default variant for adding to cart
function getDefaultVariant(product: Product) {
  if (!product.variants || product.variants.length === 0) return null;
  return product.variants.find((v) => v.isDefault) || product.variants[0];
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const initialCategoryId = searchParams.get("categoryId") ?? "";
  const dispatch = useAppDispatch();

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const hasMore = useMemo(() => items.length < total, [items.length, total]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cats, data] = await Promise.all([
          catalogApi.listCategories(),
          catalogApi.listProducts({ q: initialQ || undefined, categoryId: initialCategoryId || undefined, page: 1, limit }),
        ]);

        if (!mounted) return;
        setCategories(cats);
        setItems(data.items);
        setTotal(data.total);
        setPage(1);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, initialCategoryId]);

  async function applyFilters(next: { categoryId: string }) {
    setLoading(true);
    try {
      const data = await catalogApi.listProducts({
        q: initialQ || undefined,
        categoryId: next.categoryId || undefined,
        page: 1,
        limit,
      });
      setItems(data.items);
      setTotal(data.total);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!hasMore) return;
    const nextPage = page + 1;
    setLoading(true);
    try {
      const data = await catalogApi.listProducts({
        q: initialQ || undefined,
        categoryId: categoryId || undefined,
        page: nextPage,
        limit,
      });
      setItems((prev) => [...prev, ...data.items]);
      setTotal(data.total);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="mx-auto max-w-6xl lg:max-w-7xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Products</h1>

        <div className="mt-6 flex gap-6">
          {/* Left Sidebar - Category Filters */}
          <aside className="hidden w-48 shrink-0 md:block">
            <div className="sticky top-24 rounded border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-zinc-900">Categories</h2>
              <div className="mt-3 space-y-2">
                <button
                  className={`block w-full text-left text-sm transition ${
                    categoryId === "" ? "font-medium text-black" : "text-zinc-600 hover:text-black"
                  }`}
                  onClick={() => {
                    setCategoryId("");
                    void applyFilters({ categoryId: "" });
                  }}
                >
                  All Products
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`block w-full text-left text-sm transition ${
                      categoryId === c.id ? "font-medium text-black" : "text-zinc-600 hover:text-black"
                    }`}
                    onClick={() => {
                      setCategoryId(c.id);
                      void applyFilters({ categoryId: c.id });
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile Category Dropdown */}
          <div className="mb-4 md:hidden w-full">
            <select
              className="h-10 w-full rounded border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
              value={categoryId}
              onChange={(e) => {
                const next = e.target.value;
                setCategoryId(next);
                void applyFilters({ categoryId: next });
              }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {loading && items.length === 0 ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : null}
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => {
                const priceInfo = getProductPrice(p);
                const defaultVariant = getDefaultVariant(p);
                
                return (
                  <div
                    key={p.id}
                    className="group rounded border border-zinc-200 bg-white p-4 transition hover:border-zinc-300"
                  >
                    <Link href={`/products/${p.id}`}>
                      <div className="relative aspect-square overflow-hidden rounded bg-zinc-100">
                        <Image 
                          src={addCacheBust(p.imageUrl, p.updatedAt)} 
                          alt={p.name} 
                          fill 
                          className="object-cover transition group-hover:scale-[1.02]"
                          unoptimized
                        />
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-zinc-900">{p.name}</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {priceInfo.priceRange || formatPrice(priceInfo.price)}
                        </p>
                      </div>
                    </Link>
                    {p.type === "SIMPLE" && defaultVariant ? (
                      <Button
                        variant="primary"
                        className="mt-3 w-full"
                        disabled={!defaultVariant || defaultVariant.stock === 0}
                        onClick={(e) => {
                          e.preventDefault();
                          if (defaultVariant) {
                            dispatch(addToCart({ 
                              product: p, 
                              variant: defaultVariant,
                              quantity: 1 
                            }));
                          }
                        }}
                      >
                        {defaultVariant && defaultVariant.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </Button>
                    ) : (
                      <Link href={`/products/${p.id}`}>
                        <Button
                          variant="secondary"
                          className="mt-3 w-full"
                        >
                          Select Options
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {items.length === 0 && !loading ? (
              <p className="text-sm text-zinc-600">No products found.</p>
            ) : null}

            <div className="mt-8 flex items-center justify-center">
              {hasMore ? (
                <button
                  className="rounded border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                  disabled={loading}
                  onClick={() => void loadMore()}
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              ) : items.length > 0 ? (
                <p className="text-sm text-zinc-600">You've reached the end.</p>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


