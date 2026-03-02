"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Category, Product } from "@/types";
import { adminApi } from "@/services/adminApi";
import { uploadFile } from "@/services/uploadApi";
import {
  ProductForm,
  type ProductFormValues,
} from "@/components/admin/ProductForm";

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(dollars: string): number {
  return Math.round(parseFloat(dollars) * 100);
}

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) return;
    void loadData(productId);
  }, [productId]);

  async function loadData(id: string) {
    try {
      setLoading(true);
      const [catRes, productRes] = await Promise.all([
        adminApi.listCategories(),
        adminApi.getProduct(id),
      ]);
      setCategories(catRes.items);
      setProduct(productRes);
    } finally {
      setLoading(false);
    }
  }

  const initialValues = useMemo<ProductFormValues>(() => {
    if (!product) {
      return {
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
      };
    }

    return {
      name: product.name,
      description: product.description ?? "",
      highlights:
        product.highlights
          ?.slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((h) => h.text) ?? [""],
      type: product.type,
      categoryId: product.categoryId,
      mainImage: product.imageUrl,
      gallery1: product.galleryImages?.find((g) => g.index === 1)?.url ?? null,
      gallery2: product.galleryImages?.find((g) => g.index === 2)?.url ?? null,
      gallery3: product.galleryImages?.find((g) => g.index === 3)?.url ?? null,
      variants: product.variants?.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: centsToDollars(v.price),
        stock: String(v.stock),
        isDefault: v.isDefault,
        attributes: v.attributes || [],
      })) ?? [
        { sku: "", price: "", stock: "0", isDefault: true, attributes: [] },
      ],
      deleteVariantIds: [],
    };
  }, [product]);

  const handleSubmit = async (values: ProductFormValues) => {
    if (!product) return;
    if (!values.name || !values.categoryId || !values.mainImage) {
      alert("Fill required fields");
      return;
    }
    if (values.variants.some((v) => !v.sku || !v.price)) {
      alert("All variants need SKU and price");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        description: values.description,
        highlights: values.highlights
          .map((h) => h.trim())
          .filter((h) => h.length > 0)
          .map((text, sortOrder) => ({ text, sortOrder })),
        type: values.type,
        categoryId: values.categoryId,
      };

      if (values.mainImage instanceof File) {
        const mainUploaded = await uploadFile(
          values.mainImage,
          product.id,
          "products",
          "main",
        );
        payload.imageUrl = mainUploaded.url;
        payload.imageFileKey = mainUploaded.fileKey;
        payload.thumbUrl = mainUploaded.url;
      }

      const galleryData: { index: number; url: string; fileKey: string }[] = [];
      const galleryToDelete: number[] = [];
      const galleries = [values.gallery1, values.gallery2, values.gallery3];
      const fileTypes: ("gallery-1" | "gallery-2" | "gallery-3")[] = ["gallery-1", "gallery-2", "gallery-3"];

      for (let idx = 0; idx < galleries.length; idx += 1) {
        const image = galleries[idx];
        const existing = product.galleryImages?.find(
          (g) => g.index === idx + 1,
        );
        if (image instanceof File) {
          const uploaded = await uploadFile(
            image,
            product.id,
            "products",
            fileTypes[idx]!,
          );
          galleryData.push({
            index: idx + 1,
            url: uploaded.url,
            fileKey: uploaded.fileKey,
          });
        } else if (image === null && existing) {
          galleryToDelete.push(idx + 1);
        } else if (typeof image === "string" && existing) {
          galleryData.push({
            index: idx + 1,
            url: existing.url,
            fileKey: existing.fileKey,
          });
        }
      }

      if (galleryData.length > 0) payload.gallery = galleryData;
      if (galleryToDelete.length > 0)
        payload.deleteGalleryIndexes = galleryToDelete;

      payload.variants = values.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: dollarsToCents(v.price),
        stock: parseInt(v.stock) || 0,
        isDefault: v.isDefault,
        attributes: v.attributes.filter((a) => a.name && a.value),
      }));

      if (values.deleteVariantIds.length > 0)
        payload.deleteVariantIds = values.deleteVariantIds;

      await adminApi.updateProduct(product.id, payload);
      router.push("/admin/products");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update product");
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
      title='Edit Product'
      submitLabel='Update Product'
      categories={categories}
      initialValues={initialValues}
      loading={saving}
      onSubmit={handleSubmit}
      onCancel={() => router.push("/admin/products")}
    />
  );
}
