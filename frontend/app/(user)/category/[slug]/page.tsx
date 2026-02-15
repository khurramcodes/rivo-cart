"use client"

import ProductsListing from "@/components/user/product/ProductListing";
import { catalogApi } from "@/services/catalogApi";
import { notFound } from "next/navigation";

interface Props {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({ params }: Props) {
  try {
    const category = await catalogApi.getCategoryBySlug(params.slug);

    if (!category) {
      notFound();
    }

    return <ProductsListing initialCategoryIdProp={category.id} />;
  } catch (error) {
    console.error("Category fetch failed:", error);

    // Show proper 404 instead of crashing server
    notFound();
  }
}
