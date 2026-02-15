import ProductsListing from "@/components/user/product/ProductListing";
import { catalogApi } from "@/services/catalogApi";

interface Props {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const category = await catalogApi.getCategoryBySlug(slug);

  if (!category) {
    return <div>Category not found</div>;
  }

  return <ProductsListing initialCategoryIdProp={category.id} />;
}
