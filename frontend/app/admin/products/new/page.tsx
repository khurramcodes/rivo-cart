"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/types";
import { adminApi } from "@/services/adminApi";
import { uploadFile } from "@/services/uploadApi";
import {
  ProductForm,
  type ProductFormValues,
} from "@/components/admin/ProductForm";

export default function AdminCreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const catRes = await adminApi.listCategories();
      setCategories(catRes.items);
    } finally {
      setLoading(false);
    }
  }

  const initialValues = useMemo<ProductFormValues>(
    () => ({
      name: "",
      description: "",
      highlights: [""],
      type: "SIMPLE",
      categoryId: "",
      mainImage: null,
      gallery1: null,
      gallery2: null,
      gallery3: null,
      variants: [
        { sku: "", price: "", stock: "0", isDefault: true, attributes: [] },
      ],
      deleteVariantIds: [],
    }),
    [],
  );

  function dollarsToCents(dollars: string): number {
    return Math.round(parseFloat(dollars) * 100);
  }

  const handleSubmit = async (values: ProductFormValues) => {
    if (!values.name || !values.categoryId || !values.mainImage) {
      alert("Please fill name, category, and main image");
      return;
    }
    if (values.variants.length === 0) {
      alert("At least one variant required");
      return;
    }
    if (values.variants.some((v) => !v.sku || !v.price)) {
      alert("All variants need SKU and price");
      return;
    }
    if (values.type === "SIMPLE" && values.variants.length > 1) {
      alert("Simple products can only have one variant");
      return;
    }
    if (!(values.mainImage instanceof File)) {
      alert("Please upload a main image");
      return;
    }

    setSaving(true);
    try {
      const productId = crypto.randomUUID();

      const mainUploaded = await uploadFile(
        values.mainImage,
        productId,
        "products",
        "main",
      );

      const galleryData: { index: number; url: string; fileKey: string }[] = [];
      const galleries = [values.gallery1, values.gallery2, values.gallery3];
      for (let idx = 0; idx < galleries.length; idx += 1) {
        const image = galleries[idx];
        if (image instanceof File) {
          const fileTypes: ("gallery-1" | "gallery-2" | "gallery-3")[] = ["gallery-1", "gallery-2", "gallery-3"];
          const uploaded = await uploadFile(image, productId, "products", fileTypes[idx]!);
          galleryData.push({
            index: idx + 1,
            url: uploaded.url,
            fileKey: uploaded.fileKey,
          });
        }
      }

      const variants = values.variants.map((v) => ({
        sku: v.sku,
        price: dollarsToCents(v.price),
        stock: parseInt(v.stock) || 0,
        isDefault: v.isDefault,
        attributes: v.attributes.filter((a) => a.name && a.value),
      }));
      const highlights = values.highlights
        .map((h) => h.trim())
        .filter((h) => h.length > 0)
        .map((text, sortOrder) => ({ text, sortOrder }));

      await adminApi.createProduct({
        id: productId,
        name: values.name,
        description: values.description,
        type: values.type,
        categoryId: values.categoryId,
        imageUrl: mainUploaded.url,
        imageFileKey: mainUploaded.fileKey,
        thumbUrl: mainUploaded.url,
        gallery: galleryData,
        highlights,
        variants,
      });

      router.push("/admin/products");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <p className='text-zinc-500'>Loading...</p>
      </div>
    );
  }

  return (
    <ProductForm
      title='Create Product'
      submitLabel='Create Product'
      categories={categories}
      initialValues={initialValues}
      loading={saving}
      onSubmit={handleSubmit}
      onCancel={() => router.push("/admin/products")}
    />
  );
}
