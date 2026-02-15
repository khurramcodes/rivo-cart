"use server";

import ProductsListing from "@/components/user/product/ProductListing";
import { catalogApi } from "@/services/catalogApi";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  if (!slug) notFound();

  let category;
  try {
    category = await catalogApi.getCategoryBySlug(slug);
  } catch (err) {
    console.error("Error fetching category:", err);
    notFound();
  }

  if (!category) notFound();

  return <ProductsListing initialCategoryIdProp={category.id} />;
}
