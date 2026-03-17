"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/services/adminApi";
import type { Product } from "@/types";
import { formatPrice } from "@/config/currency";

function toDisplayPrice(product: Product) {
  if (!product.variants || product.variants.length === 0) return "N/A";
  const prices = product.variants.map((item) => item.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
}

type Props = {
  selectedProductIds: string[];
  onAddProduct: (product: Product) => void;
};

export function ProductPicker({ selectedProductIds, onAddProduct }: Props) {
  const [search, setSearch] = useState("");
  const trimmed = search.trim();

  const { data, isFetching } = useQuery({
    queryKey: ["admin-products-search", trimmed],
    queryFn: async () =>
      adminApi.listProducts({
        q: trimmed || undefined,
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDir: "desc",
      }),
  });

  const products = useMemo(() => data?.items ?? [], [data?.items]);

  return (
    <section className="rounded border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Add Products</h2>
      <Input
        className="mt-3"
        placeholder="Search products by title"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
        {isFetching ? <p className="text-sm text-zinc-500">Loading products...</p> : null}
        {!isFetching && products.length === 0 ? (
          <p className="text-sm text-zinc-500">No products found.</p>
        ) : null}
        {products.map((product) => {
          const alreadyAdded = selectedProductIds.includes(product.id);
          return (
            <div
              key={product.id}
              className="flex items-center justify-between gap-3 rounded border border-zinc-200 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">{product.name}</p>
                <p className="text-xs text-zinc-500">{toDisplayPrice(product)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={alreadyAdded}
                onClick={() => onAddProduct(product)}
              >
                {alreadyAdded ? "Added" : "Add"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
