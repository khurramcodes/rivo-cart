import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi, type Discount, type DiscountScope, type DiscountType } from "@/services/adminApi";
import { catalogApi } from "@/services/catalogApi";
import type { Category, Product } from "@/types";
import { discountSchema, type DiscountFormData } from "@/schemas/discount.schema";
import { toIsoStartDate, toIsoEndDate } from "@/utils/date";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getErrorMessage = (err: unknown) => {
  const anyErr = err as {
    response?: { data?: { error?: { message?: string } } };
    message?: string;
  };
  return (
    anyErr?.response?.data?.error?.message ??
    anyErr?.message ??
    "Something went wrong"
  );
};

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      startDate: "",
      endDate: "",
      priority: 0,
      isStackable: false,
      isActive: true,
      scope: "SITE_WIDE",
      productIds: [],
      variantIds: [],
      categoryIds: [],
      collectionIds: [],
    },
    mode: "onBlur",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [discountData, categoryData, productData] = await Promise.all([
          adminApi.listDiscounts(),
          catalogApi.listCategories(),
          adminApi.listProducts({ page: 1, limit: 50 }),
        ]);
        if (!mounted) return;
        setDiscounts(discountData);
        setCategories(categoryData);
        setProducts(productData.items);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      startDate: "",
      endDate: "",
      priority: 0,
      isStackable: false,
      isActive: true,
      scope: "SITE_WIDE",
      productIds: [],
      variantIds: [],
      categoryIds: [],
      collectionIds: [],
    });
    setEditingId(null);
    setStatus(null);
  };

  const handleEdit = (discount: Discount) => {
    setEditingId(discount.id);
    form.reset({
      name: discount.name,
      description: discount.description ?? "",
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      startDate: formatDate(discount.startDate),
      endDate: formatDate(discount.endDate),
      priority: discount.priority ?? 0,
      isStackable: discount.isStackable,
      isActive: discount.isActive,
      scope: discount.scope,
      productIds: discount.products?.map((p) => p.productId) ?? [],
      variantIds: discount.variants?.map((v) => v.variantId) ?? [],
      categoryIds: discount.categories?.map((c) => c.categoryId) ?? [],
      collectionIds: discount.collections?.map((c) => c.collectionId) ?? [],
    });
    setStatus(null);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    setStatus(null);
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: toIsoStartDate(data.startDate),
        endDate: toIsoEndDate(data.endDate),
        isActive: data.isActive,
        priority: data.priority,
        isStackable: data.isStackable,
        scope: data.scope,
        productIds: data.scope === "PRODUCT" ? data.productIds : undefined,
        variantIds: data.scope === "VARIANT" ? data.variantIds : undefined,
        categoryIds: data.scope === "CATEGORY" ? data.categoryIds : undefined,
        collectionIds: data.scope === "COLLECTION" ? data.collectionIds : undefined,
      };

      const next = editingId
        ? await adminApi.updateDiscount(editingId, payload)
        : await adminApi.createDiscount(payload);

      setDiscounts((prev) => {
        const exists = prev.some((d) => d.id === next.id);
        if (!exists) return [next, ...prev];
        return prev.map((d) => (d.id === next.id ? next : d));
      });

      setStatus({
        type: "success",
        message: editingId ? "Discount updated successfully." : "Discount created successfully.",
      });

      if (!editingId) resetForm();
    } catch (err) {
      setStatus({ type: "error", message: getErrorMessage(err) });
    }
  });

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteDiscount(id);
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm({ open: false, id: null });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return {
    discounts,
    products,
    categories,
    loading,
    error,
    editingId,
    status,
    deleteConfirm,
    setDeleteConfirm,
    form,
    resetForm,
    handleEdit,
    handleSubmit,
    handleDelete,
    scopeLocked: editingId !== null,
  };
}
