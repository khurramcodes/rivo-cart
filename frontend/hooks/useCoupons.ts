import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi, type Coupon, type DiscountType } from "@/services/adminApi";
import { couponSchema } from "@/schemas/coupon.schema";
import { toIsoStartDate, toIsoEndDate } from "@/utils/date";

type CouponFormData = {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  minimumCartValue?: number;
  maxRedemptions?: number;
  maxRedemptionsPerUser?: number;
  isStackable: boolean;
  isActive: boolean;
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      startDate: "",
      endDate: "",
      minimumCartValue: undefined,
      maxRedemptions: undefined,
      maxRedemptionsPerUser: undefined,
      isStackable: false,
      isActive: true,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const couponData = await adminApi.listCoupons();
        if (!mounted) return;
        setCoupons(couponData);
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
      code: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      startDate: "",
      endDate: "",
      minimumCartValue: undefined,
      maxRedemptions: undefined,
      maxRedemptionsPerUser: undefined,
      isStackable: false,
      isActive: true,
    });
    setEditingId(null);
    setStatus(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    form.reset({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      startDate: formatDate(coupon.startDate),
      endDate: formatDate(coupon.endDate),
      minimumCartValue: coupon.minimumCartValue ?? undefined,
      maxRedemptions: coupon.maxRedemptions ?? undefined,
      maxRedemptionsPerUser: coupon.maxRedemptionsPerUser ?? undefined,
      isStackable: coupon.isStackable,
      isActive: coupon.isActive,
    });
    setStatus(null);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    setStatus(null);
    try {
      const payload = {
        code: data.code,
        description: data.description || undefined,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: toIsoStartDate(data.startDate),
        endDate: toIsoEndDate(data.endDate),
        isActive: data.isActive,
        minimumCartValue: data.minimumCartValue,
        maxRedemptions: data.maxRedemptions,
        maxRedemptionsPerUser: data.maxRedemptionsPerUser,
        isStackable: data.isStackable,
      };

      const next = editingId
        ? await adminApi.updateCoupon(editingId, payload)
        : await adminApi.createCoupon(payload);

      setCoupons((prev) => {
        const exists = prev.some((c) => c.id === next.id);
        if (!exists) return [next, ...prev];
        return prev.map((c) => (c.id === next.id ? next : c));
      });

      setStatus({
        type: "success",
        message: editingId ? "Coupon updated successfully." : "Coupon created successfully.",
      });

      if (!editingId) resetForm();
    } catch (err) {
      setStatus({ type: "error", message: getErrorMessage(err) });
    }
  });

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirm({ open: false, id: null });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return {
    coupons,
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
  };
}
