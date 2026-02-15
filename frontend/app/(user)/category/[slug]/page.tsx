import ProductsListing from "@/components/user/product/ProductListing";
import { catalogApi } from "@/services/catalogApi";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic"; // allows async API calls

interface Props {
  params: Promise<{ slug: string }>; // Note: params is now a Promise
}

export default async function CategoryPage({ params }: Props) {
  
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  if (!slug) notFound();

  const category = await catalogApi.getCategoryBySlug(slug);

  if (!category) notFound();

  return <ProductsListing initialCategoryIdProp={category.id} />;
}
