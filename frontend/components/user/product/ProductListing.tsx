"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { catalogApi } from "@/services/catalogApi";
import { pricingApi, type VariantPricing } from "@/services/pricingApi";
import type { Product } from "@/types";
import type { Category } from "@/types";
import { ProductCard } from "@/components/user/product/ProductCard";

// Helper to get default variant for adding to cart
function getDefaultVariant(product: Product) {
  if (!product.variants || product.variants.length === 0) return null;
  return product.variants.find((v) => v.isDefault) || product.variants[0];
}

export default function ProductsListing({
  initialCategoryIdProp,
  categorySlug,
}: {
  initialCategoryIdProp?: string;
  categorySlug?: string;
}) {
  
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialCategoryId =
    initialCategoryIdProp ?? searchParams.get("categoryId") ?? "";

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;
  const [pricingMap, setPricingMap] = useState<Map<string, VariantPricing>>(
    new Map(),
  );

  const hasMore = useMemo(() => items.length < total, [items.length, total]);

  // useEffect(() => {
  //   let mounted = true;
  //   (async () => {
  //     try {
  //       const [cats, data] = await Promise.all([
  //         catalogApi.listCategories(),
  //         catalogApi.listProducts({
  //           q: initialQ || undefined,
  //           categoryId: initialCategoryId || undefined,
  //           page: 1,
  //           limit,
  //         }),
  //       ]);

  //       if (!mounted) return;
  //       setCategories(cats);
  //       setItems(data.items);
  //       setTotal(data.total);
  //       setPage(1);

  //       // Fetch pricing for all default variants
  //       const variantIds = data.items
  //         .map((p) => getDefaultVariant(p)?.id)
  //         .filter((id): id is string => !!id);

  //       if (variantIds.length > 0) {
  //         const pricingResults =
  //           await pricingApi.getBulkVariantPricing(variantIds);
  //         if (!mounted) return;
  //         const newMap = new Map<string, VariantPricing>();
  //         pricingResults.forEach((r) => {
  //           if (r.pricing) newMap.set(r.variantId, r.pricing);
  //         });
  //         setPricingMap(newMap);
  //       }
  //     } finally {
  //       if (mounted) setLoading(false);
  //     }
  //   })();
  //   return () => {
  //     mounted = false;
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [initialQ, initialCategoryId]);


useEffect(() => {
  let mounted = true;

  (async () => {
    try {
      let resolvedCategoryId = initialCategoryId;

      // ✅ STEP 1: resolve slug → categoryId
      if (!resolvedCategoryId && categorySlug) {
        try {
          const category = await catalogApi.getCategoryBySlug(categorySlug);
          resolvedCategoryId = category?.id ?? "";
        } catch (err) {
          console.error("Failed to resolve category slug:", err);
        }
      }

      if (!mounted) return;

      setCategoryId(resolvedCategoryId);

      const [cats, data] = await Promise.all([
        catalogApi.listCategories(),
        catalogApi.listProducts({
          q: initialQ || undefined,
          categoryId: resolvedCategoryId || undefined,
          page: 1,
          limit,
        }),
      ]);

      if (!mounted) return;

      setCategories(cats);
      setItems(data.items);
      setTotal(data.total);
      setPage(1);

      const variantIds = data.items
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
    } finally {
      if (mounted) setLoading(false);
    }
  })();

  return () => {
    mounted = false;
  };
}, [categorySlug, initialCategoryId, initialQ]);


  async function applyFilters(next: {
    categoryId: string;
    minPrice?: string;
    maxPrice?: string;
  }) {
    setLoading(true);
    try {
      const data = await catalogApi.listProducts({
        q: initialQ || undefined,
        categoryId: next.categoryId || undefined,
        minPrice: next.minPrice ? Number(next.minPrice) * 100 : undefined,
        maxPrice: next.maxPrice ? Number(next.maxPrice) * 100 : undefined,
        page: 1,
        limit,
      });
      setItems(data.items);
      setTotal(data.total);
      setPage(1);

      // Fetch pricing for all default variants
      const variantIds = data.items
        .map((p) => getDefaultVariant(p)?.id)
        .filter((id): id is string => !!id);

      if (variantIds.length > 0) {
        const pricingResults =
          await pricingApi.getBulkVariantPricing(variantIds);
        const newMap = new Map<string, VariantPricing>();
        pricingResults.forEach((r) => {
          if (r.pricing) newMap.set(r.variantId, r.pricing);
        });
        setPricingMap(newMap);
      }
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
        minPrice: minPrice ? Number(minPrice) * 100 : undefined,
        maxPrice: maxPrice ? Number(maxPrice) * 100 : undefined,
        page: nextPage,
        limit,
      });
      setItems((prev) => [...prev, ...data.items]);
      setTotal(data.total);
      setPage(nextPage);

      // Fetch pricing for new items
      const variantIds = data.items
        .map((p) => getDefaultVariant(p)?.id)
        .filter((id): id is string => !!id);

      if (variantIds.length > 0) {
        const pricingResults =
          await pricingApi.getBulkVariantPricing(variantIds);
        setPricingMap((prev) => {
          const newMap = new Map(prev);
          pricingResults.forEach((r) => {
            if (r.pricing) newMap.set(r.variantId, r.pricing);
          });
          return newMap;
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-white'>
      <main className='mx-auto max-w-6xl lg:max-w-7xl px-4 py-10'>
        <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
          Products
        </h1>

        <div className='mt-6 flex flex-col md:flex-row gap-6'>
          {/* Left Sidebar - Filters */}
          <aside className='hidden w-60 shrink-0 md:block'>
            <div className='sticky top-24 space-y-4'>
              {/* Category Filter */}
              <div className='rounded border border-zinc-200 bg-white p-4'>
                <h2 className='text-sm font-semibold text-zinc-900'>
                  Categories
                </h2>
                <div className='mt-3 space-y-2'>
                  <button
                    className={`block w-full text-left text-sm transition ${
                      categoryId === ""
                        ? "font-medium text-black"
                        : "text-zinc-600 hover:text-black"
                    }`}
                    onClick={() => {
                      setCategoryId("");
                      void applyFilters({ categoryId: "", minPrice, maxPrice });
                    }}>
                    All Products
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      className={`block w-full text-left text-sm transition ${
                        categoryId === c.id
                          ? "font-medium text-black"
                          : "text-zinc-600 hover:text-black"
                      }`}
                      onClick={() => {
                        setCategoryId(c.id);
                        void applyFilters({
                          categoryId: c.id,
                          minPrice,
                          maxPrice,
                        });
                      }}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className='rounded border border-zinc-200 bg-white p-4'>
                <h2 className='text-sm font-semibold text-zinc-900'>
                  Price Range
                </h2>
                <div className='mt-3 space-y-3'>
                  <div>
                    <label className='block text-xs text-zinc-600 mb-1'>
                      Min Price ($)
                    </label>
                    <input
                      type='number'
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder='0'
                      className='w-full px-3 py-2 text-sm text-zinc-900 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-black'
                      min='0'
                    />
                  </div>
                  <div>
                    <label className='block text-xs text-zinc-600 mb-1'>
                      Max Price ($)
                    </label>
                    <input
                      type='number'
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder={maxPrice || "0"}
                      className='w-full px-3 py-2 text-sm text-zinc-900 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-black'
                      min='0'
                    />
                  </div>
                  <button
                    className='w-full rounded bg-black px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition'
                    onClick={() =>
                      void applyFilters({ categoryId, minPrice, maxPrice })
                    }>
                    Apply
                  </button>
                  {minPrice || maxPrice ? (
                    <button
                      className='w-full rounded border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition'
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                        void applyFilters({
                          categoryId,
                          minPrice: "",
                          maxPrice: "",
                        });
                      }}>
                      Clear Price
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Category Dropdown */}
          <div className='mb-4 md:hidden w-full'>
            <select
              className='h-10 w-full rounded border border-zinc-200 bg-white px-3 text-sm text-zinc-900'
              value={categoryId}
              onChange={(e) => {
                const next = e.target.value;
                setCategoryId(next);
                void applyFilters({ categoryId: next });
              }}>
              <option value=''>All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className='flex-1'>
            {loading && items.length === 0 ? (
              <div className='text-sm text-zinc-600'>Loading…</div>
            ) : null}

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {items.map((product) => {
                const defaultVariant = getDefaultVariant(product);
                const pricing = defaultVariant
                  ? pricingMap.get(defaultVariant.id)
                  : null;

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    pricing={pricing}
                  />
                );
              })}
            </div>

            {items.length === 0 && !loading ? (
              <p className='text-sm text-zinc-600'>No products found.</p>
            ) : null}

            <div className='mt-8 flex items-center justify-center'>
              {hasMore ? (
                <button
                  className='rounded border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100'
                  disabled={loading}
                  onClick={() => void loadMore()}>
                  {loading ? "Loading…" : "Load more"}
                </button>
              ) : items.length > 0 ? (
                <p className='text-sm text-zinc-600'>You've reached the end.</p>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
