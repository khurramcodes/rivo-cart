"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi } from "@/services/adminApi";
import type { Category, Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatPrice } from "@/config/currency";

type SortKey = "name" | "category" | "price" | "stock" | "type";
type SortDir = "asc" | "desc";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedPrice, setAppliedPrice] = useState<{ min?: number; max?: number }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  });

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [page, sortKey, sortDir, appliedPrice.min, appliedPrice.max]);

  async function loadCategories() {
    const catRes = await adminApi.listCategories();
    setCategories(catRes.items);
  }

  async function loadProducts() {
    try {
      setLoading(true);
      const prodRes = await adminApi.listProducts({
        page,
        limit,
        sortBy: sortKey,
        sortDir,
        minPrice: appliedPrice.min,
        maxPrice: appliedPrice.max,
      });
      setProducts(prodRes.items);
      setTotal(prodRes.total);
      setLimit(prodRes.limit);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const getCategoryName = (product: Product) =>
    product.category?.name ?? categoryMap.get(product.categoryId) ?? "Uncategorized";

  const getProductDisplayPrice = (product: Product): string => {
    if (!product.variants || product.variants.length === 0) return "N/A";
    if (product.type === "SIMPLE") return formatPrice(product.variants[0].price);
    const prices = product.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
  };

  const getProductStock = (product: Product) =>
    product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ChevronDown size={14} className="text-zinc-300" />;
    return sortDir === "asc" ? (
      <ChevronUp size={14} className="text-zinc-700" />
    ) : (
      <ChevronDown size={14} className="text-zinc-700" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Products</h1>
          <p className="text-zinc-600 text-sm mt-1">Manage products with variants, SKUs, and stock</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded border border-zinc-200 bg-white px-3 py-2 text-sm">
            <input
              type="number"
              min={0}
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-24 bg-transparent text-zinc-800 outline-none placeholder:text-zinc-400"
            />
            <span className="text-zinc-300">-</span>
            <input
              type="number"
              min={0}
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 bg-transparent text-zinc-800 outline-none placeholder:text-zinc-400"
            />
            <Button
              variant="ghost"
              className="h-8 px-3"
              onClick={() => {
                const minRaw = parseFloat(minPrice);
                const maxRaw = parseFloat(maxPrice);
                const min = Number.isFinite(minRaw) ? Math.round(minRaw * 100) : undefined;
                const max = Number.isFinite(maxRaw) ? Math.round(maxRaw * 100) : undefined;
                setAppliedPrice({ min, max });
                setPage(1);
              }}
            >
              Apply
            </Button>
            <Button
              variant="ghost"
              className="h-8 px-3"
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
                setAppliedPrice({});
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
          <Link href="/admin/products/new">
            <Button className="gap-2">
              <Plus size={18} />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-225 w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Name {renderSortIcon("name")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("category")}>
                    Category {renderSortIcon("category")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("price")}>
                    Price {renderSortIcon("price")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("stock")}>
                    Stock {renderSortIcon("stock")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("type")}>
                    Type {renderSortIcon("type")}
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-zinc-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-zinc-900">{product.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{getCategoryName(product)}</td>
                  <td className="px-4 py-3 text-zinc-900">{getProductDisplayPrice(product)}</td>
                  <td className="px-4 py-3 text-zinc-600">{getProductStock(product)}</td>
                  <td className="px-4 py-3 text-zinc-600">{product.type}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Button variant="ghost" className="p-2">
                          <Pencil size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="p-2 text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteConfirm({ open: true, productId: product.id })}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-zinc-500" colSpan={6}>
                    No products yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 text-sm text-zinc-600">
          <span>
            Showing {total === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, productId: null })}
        onConfirm={async () => {
          if (!deleteConfirm.productId) return;
          try {
            await adminApi.deleteProduct(deleteConfirm.productId);
            setProducts((prev) => prev.filter((p) => p.id !== deleteConfirm.productId));
          } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to delete product");
          }
        }}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
