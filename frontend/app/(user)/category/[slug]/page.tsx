import ProductsListing from "@/components/user/product/ProductListing";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  return <ProductsListing categorySlug={slug} />;
}
