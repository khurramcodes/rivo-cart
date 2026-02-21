"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Review, Product } from "@/types";
import { reviewApi, type ReviewSort } from "@/services/reviewApi";
import { catalogApi } from "@/services/catalogApi";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewEditor } from "@/components/user/reviews/ReviewEditor";
import { useAppSelector } from "@/store/hooks";

export default function ProductReviewsPage() {
  const params = useParams<{ id: string }>();
  const productId = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id],
  );

  const [product, setProduct] = useState<Product | null>(null);
  const [items, setItems] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [loading, setLoading] = useState(true);
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await catalogApi.getProduct(productId);
        if (mounted) setProduct(p);
      } catch {
        if (mounted) setProduct(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [productId]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    reviewApi
      .listApproved(productId, { page, limit, sort })
      .then((data) => {
        if (!mounted) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [productId, page, limit, sort]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Reviews</h1>
            {product ? (
              <p className="mt-1 text-sm text-zinc-600">
                For{" "}
                <Link href={`/products/${productId}`} className="underline underline-offset-4">
                  {product.name}
                </Link>
              </p>
            ) : null}
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <StarRating value={product?.ratingAverage ?? 0} />
              <span className="text-sm text-zinc-700">
                {(product?.ratingAverage ?? 0).toFixed(1)} ({product?.ratingCount ?? 0})
              </span>
            </div>
            <div className="mt-2">
              <label className="text-xs text-zinc-500">Sort</label>
              <select
                className="ml-2 h-9 rounded border border-zinc-200 px-2 text-sm"
                value={sort}
                onChange={(e) => {
                  setPage(1);
                  setSort(e.target.value as ReviewSort);
                }}
              >
                <option value="newest">Newest</option>
                <option value="rating_desc">Rating (high to low)</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? <p className="mt-6 text-sm text-zinc-600">Loading…</p> : null}

        {!loading && items.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-600">No reviews yet.</p>
        ) : null}

        <div className="mt-6 space-y-4">
          <ReviewEditor productId={productId} isAuthenticated={Boolean(user)} />

          {items.map((r) => (
            <div key={r.id} className="rounded border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} />
                  {r.isVerifiedPurchase ? (
                    <span className="text-[11px] rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                      Verified purchase
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-800">{r.comment}</p>
              <p className="mt-2 text-xs text-zinc-500">by {r.user?.name ?? "Customer"}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            className="h-9 rounded border border-zinc-200 px-3 text-sm disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <p className="text-sm text-zinc-600">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            className="h-9 rounded border border-zinc-200 px-3 text-sm disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}

