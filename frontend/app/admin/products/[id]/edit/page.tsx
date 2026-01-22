"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Category, Product } from "@/types";
import { adminApi } from "@/services/adminApi";
import { uploadToImageKit } from "@/services/imagekitUpload";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";

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
        type: "SIMPLE",
        categoryId: "",
        mainImage: null,
        gallery1: null,
        gallery2: null,
        gallery3: null,
        variants: [{ sku: "", price: "", stock: "0", isDefault: true, attributes: [] }],
        deleteVariantIds: [],
      };
    }

    return {
      name: product.name,
      description: product.description ?? "",
      type: product.type,
      categoryId: product.categoryId,
      mainImage: product.imageUrl,
      gallery1: product.galleryImages?.find((g) => g.index === 1)?.url ?? null,
      gallery2: product.galleryImages?.find((g) => g.index === 2)?.url ?? null,
      gallery3: product.galleryImages?.find((g) => g.index === 3)?.url ?? null,
      variants:
        product.variants?.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: centsToDollars(v.price),
          stock: String(v.stock),
          isDefault: v.isDefault,
          attributes: v.attributes || [],
        })) ?? [{ sku: "", price: "", stock: "0", isDefault: true, attributes: [] }],
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
      const folder = product.imageFolderPath!;
      const payload: any = {
        name: values.name,
        description: values.description,
        type: values.type,
        categoryId: values.categoryId,
      };

      if (values.mainImage instanceof File) {
        const mainUploaded = await uploadToImageKit(
          values.mainImage,
          folder,
          "main.webp",
          product.imageFileId,
        );
        payload.imageUrl = mainUploaded.url;
        payload.imageFileId = mainUploaded.fileId;
        payload.imageFilePath = mainUploaded.filePath;
        payload.thumbUrl = mainUploaded.url;
        payload.thumbFileId = mainUploaded.fileId;
        payload.thumbFilePath = mainUploaded.filePath;
      }

      const galleryData: { index: number; url: string; fileId: string; filePath: string }[] = [];
      const galleryToDelete: number[] = [];
      const galleries = [values.gallery1, values.gallery2, values.gallery3];

      for (let idx = 0; idx < galleries.length; idx += 1) {
        const image = galleries[idx];
        const existing = product.galleryImages?.find((g) => g.index === idx + 1);
        if (image instanceof File) {
          const uploaded = await uploadToImageKit(
            image,
            folder,
            `gallery-${idx + 1}.webp`,
            existing?.fileId,
          );
          galleryData.push({
            index: idx + 1,
            url: uploaded.url,
            fileId: uploaded.fileId,
            filePath: uploaded.filePath,
          });
        } else if (image === null && existing) {
          galleryToDelete.push(idx + 1);
        } else if (typeof image === "string" && existing) {
          galleryData.push({
            index: idx + 1,
            url: existing.url,
            fileId: existing.fileId,
            filePath: existing.filePath,
          });
        }
      }

      if (galleryData.length > 0) payload.gallery = galleryData;
      if (galleryToDelete.length > 0) payload.deleteGalleryIndexes = galleryToDelete;

      payload.variants = values.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: dollarsToCents(v.price),
        stock: parseInt(v.stock) || 0,
        isDefault: v.isDefault,
        attributes: v.attributes.filter((a) => a.name && a.value),
      }));

      if (values.deleteVariantIds.length > 0) payload.deleteVariantIds = values.deleteVariantIds;

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
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <ProductForm
      title="Edit Product"
      submitLabel="Update Product"
      categories={categories}
      initialValues={initialValues}
      loading={saving}
      onSubmit={handleSubmit}
      onCancel={() => router.push("/admin/products")}
    />
  );
}
