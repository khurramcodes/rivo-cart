"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Slider from "react-slick";
import { StarRating } from "@/components/ui/StarRating";
import { reviewApi } from "@/services/reviewApi";
import type { Review } from "@/types";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { Quote } from "lucide-react";

const MOCK_REVIEWS = [
  {
    id: "1",
    rating: 5,
    comment:
      "I've been using this flour for rotis and the taste is noticeably better than regular atta. Feels very fresh and wholesome.",
    user: { name: "Ayesha Khan" },
    product: { name: "Multi Grain Flour - Made with 14 Natural Ingredients" },
  },
  {
    id: "2",
    rating: 5,
    comment:
      "After using this rosemary oil for a few weeks my hair fall has reduced and my hair feels healthier.",
    user: { name: "Fatima Ahmed" },
    product: { name: "Rosemary Hair Growth Oil" },
  },
  {
    id: "3",
    rating: 5,
    comment:
      "These pumpkin seeds are very fresh and crunchy. Perfect for snacking or adding to salads.",
    user: { name: "Ali Raza" },
    product: {
      name: "Pumpkin Seeds - Creamy, Crunchy, and Healthy Bites in Every Munch",
    },
  },
  {
    id: "4",
    rating: 5,
    comment:
      "Great mix of nuts and the quality is excellent. I keep a small bowl on my desk for healthy snacking.",
    user: { name: "Usman Tariq" },
    product: { name: "Mix Nuts - The Ultimate Blend for Health" },
  },
  {
    id: "5",
    rating: 5,
    comment:
      "My family really liked the flavor of this multigrain flour. The rotis stay soft and filling.",
    user: { name: "Sana Malik" },
    product: { name: "Multi Grain Flour - Made with 14 Natural Ingredients" },
  },
  {
    id: "6",
    rating: 5,
    comment:
      "The oil has a very natural fragrance and absorbs nicely. It doesn't feel heavy on the scalp.",
    user: { name: "Hassan Shah" },
    product: { name: "Rosemary Hair Growth Oil" },
  },
] as Review[];

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <StarRating value={review.rating} size={18} />
        {review.isVerifiedPurchase && (
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            Verified
          </span>
        )}
      </div>

      <p className="mt-3 flex-1 text-sm text-zinc-700 line-clamp-2">
        &ldquo;{review.comment}&rdquo;
      </p>

      <p className="mt-3 text-sm font-medium text-zinc-900">
        — {review.user?.name ?? "Customer"}
      </p>

      {review.product && (
        <Link
          href={`/products/${review.productId}`}
          className="mt-2 text-xs text-zinc-500 hover:text-primary line-clamp-1"
        >
          {review.product.name}
        </Link>
      )}
    </div>
  );
}

export function CustomerReviews() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    reviewApi
      .topForHome()
      .then((data) => {
        if (!mounted) return;

        if (data.length > 5) {
          setItems(data);
        } else {
          setItems(MOCK_REVIEWS);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 5000,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  if (loading && items.length === 0) {
    return (
      <section className="w-full py-16">
        <div className="flex min-h-[200px] items-center justify-center">
          <GlobalLoader />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="w-full py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Quote className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Customer Reviews
          </h2>
        </div>

        <p className="mt-2 text-sm text-zinc-600">
          See what our customers are saying about our products
        </p>

        <div className="mt-10">
          <Slider {...settings}>
            {items.map((review, i) => (
              <div key={i} className="px-3">
                <ReviewCard review={review} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}