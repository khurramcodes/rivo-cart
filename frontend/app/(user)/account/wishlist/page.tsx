"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWishlist, toggleWishlist } from "@/store/slices/wishlistSlice";
import { formatPrice } from "@/config/currency";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { Button } from "@/components/ui/Button";
import { Heart } from "lucide-react";

function getDisplayPrice(product: { variants?: { price: number }[] }) {
  if (!product.variants?.length) return null;
  const prices = product.variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? min : { min, max };
}

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { items, loading } = useAppSelector((s) => s.wishlist);

  useEffect(() => {
    if (!user) return;
    void dispatch(fetchWishlist());
  }, [user, dispatch]);

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Wishlist</h1>
        <p className="mt-2 text-sm text-zinc-600">Please login to view your wishlist.</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Wishlist</h1>
      <p className="mt-2 text-sm text-zinc-600">
        {items.length === 0
          ? "Your wishlist is empty."
          : `You have ${items.length} item${items.length === 1 ? "" : "s"} in your wishlist.`}
      </p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-4 text-sm font-medium text-zinc-700">No items saved yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Tap the heart icon on the product card to add items to your wishlist.
          </p>
          <Link href="/products" className="mt-6 inline-block">
            <Button>Browse products</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const product = item.product;
            const priceData = getDisplayPrice(product);
            return (
              <div
                key={item.id}
                className="group rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-zinc-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-contain bg-white transition group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-zinc-900 line-clamp-2">{product.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {priceData === null
                        ? ""
                        : typeof priceData === "number"
                          ? formatPrice(priceData)
                          : `${formatPrice(priceData.min)} – ${formatPrice(priceData.max)}`}
                    </p>
                  </div>
                </Link>
                <div className="flex gap-2 p-4 pt-0">
                  <Link href={`/products/${product.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full" rounded="full">
                      View product
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => dispatch(toggleWishlist(product.id))}
                    className="flex shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white p-2.5 text-zinc-700 hover:bg-zinc-50"
                    aria-label="Remove from wishlist"
                  >
                    <Heart className="h-5 w-5 fill-primary text-primary" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
