import ProductsPage from "../../products/page";
import { catalogApi } from "@/services/catalogApi";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const category = await catalogApi.getCategoryBySlug(slug);

  if (!category) {
    return <div>Category not found</div>;
  }

  return <ProductsPage initialCategoryIdProp={category.id} />;
}
