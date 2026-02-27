"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, ProductType } from "@/types";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { VariantFormSection } from "@/components/admin/VariantFormSection";

export type VariantFormData = {
  id?: string;
  sku: string;
  price: string;
  stock: string;
  isDefault: boolean;
  attributes: { name: string; value: string }[];
};

export type ProductFormValues = {
  name: string;
  description: string;
  highlights: string[];
  type: ProductType;
  categoryId: string;
  mainImage: File | string | null;
  gallery1: File | string | null;
  gallery2: File | string | null;
  gallery3: File | string | null;
  variants: VariantFormData[];
  deleteVariantIds: string[];
};

type ProductFormProps = {
  title: string;
  submitLabel?: string;
  categories: Category[];
  initialValues: ProductFormValues;
  loading?: boolean;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function ProductForm({
  title,
  submitLabel = "Save product",
  categories,
  initialValues,
  loading,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormValues>(initialValues);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  // Two-step category selection: parent -> subcategory (still saved as single categoryId)
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");

  const subCategories = useMemo(
    () => categories.filter((c) => c.parentId === parentCategoryId),
    [categories, parentCategoryId],
  );

  useEffect(() => {
    const current = form.categoryId ? categoryById.get(form.categoryId) : undefined;
    if (current?.parentId) {
      setParentCategoryId(current.parentId);
      setSubCategoryId(current.id);
      return;
    }
    // If current is a parent category (or empty), reflect that
    setParentCategoryId(form.categoryId ?? "");
    setSubCategoryId("");
  }, [form.categoryId, categoryById]);

  const setField = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addHighlight = () => {
    setForm((prev) => ({ ...prev, highlights: [...prev.highlights, ""] }));
  };

  const updateHighlight = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.highlights];
      next[index] = value;
      return { ...prev, highlights: next };
    });
  };

  const removeHighlight = (index: number) => {
    setForm((prev) => {
      const next = prev.highlights.filter((_, i) => i !== index);
      return { ...prev, highlights: next.length > 0 ? next : [""] };
    });
  };

  const handleTypeChange = (value: ProductType) => {
    setForm((prev) => {
      if (value === "SIMPLE" && prev.variants.length > 1) {
        const first = { ...prev.variants[0], isDefault: true };
        return { ...prev, type: value, variants: [first] };
      }
      return { ...prev, type: value };
    });
  };

  const addVariant = () =>
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { sku: "", price: "", stock: "0", isDefault: false, attributes: [] },
      ],
    }));

  const removeVariant = (index: number, variantId?: string) => {
    setForm((prev) => {
      if (prev.variants.length <= 1) {
        alert("At least one variant required");
        return prev;
      }
      const nextVariants = prev.variants.filter((_, i) => i !== index);
      const deleteVariantIds = variantId
        ? [...prev.deleteVariantIds, variantId]
        : prev.deleteVariantIds;
      return { ...prev, variants: nextVariants, deleteVariantIds };
    });
  };

  const updateVariant = (index: number, field: keyof VariantFormData, value: any) => {
    setForm((prev) => {
      const next = [...prev.variants];
      next[index] = { ...next[index], [field]: value };
      if (field === "isDefault" && value === true) {
        for (let i = 0; i < next.length; i += 1) {
          if (i !== index) next[i].isDefault = false;
        }
      }
      return { ...prev, variants: next };
    });
  };

  const addAttribute = (variantIndex: number) => {
    setForm((prev) => {
      const next = [...prev.variants];
      next[variantIndex] = {
        ...next[variantIndex],
        attributes: [...next[variantIndex].attributes, { name: "", value: "" }],
      };
      return { ...prev, variants: next };
    });
  };

  const updateAttribute = (
    variantIndex: number,
    attrIndex: number,
    field: "name" | "value",
    value: string,
  ) => {
    setForm((prev) => {
      const next = [...prev.variants];
      const attrs = [...next[variantIndex].attributes];
      attrs[attrIndex] = { ...attrs[attrIndex], [field]: value };
      next[variantIndex] = { ...next[variantIndex], attributes: attrs };
      return { ...prev, variants: next };
    });
  };

  const removeAttribute = (variantIndex: number, attrIndex: number) => {
    setForm((prev) => {
      const next = [...prev.variants];
      const attrs = [...next[variantIndex].attributes];
      attrs.splice(attrIndex, 1);
      next[variantIndex] = { ...next[variantIndex], attributes: attrs };
      return { ...prev, variants: next };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
          <p className="text-sm text-zinc-500">Manage core product details and variants.</p>
        </div>
        <div className="flex items-center gap-3">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
              Back
            </Button>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded border border-zinc-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900"
                disabled={loading}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-zinc-700">Product Highlights</label>
                <Button type="button" variant="ghost" onClick={addHighlight} disabled={loading} className="h-8 px-2 text-xs">
                  Add More
                </Button>
              </div>
              <div className="space-y-2">
                {form.highlights.map((highlight, index) => (
                  <div key={`highlight-${index}`} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={highlight}
                      onChange={(e) => updateHighlight(index, e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900"
                      placeholder={`Highlight ${index + 1}`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      disabled={loading}
                      className="h-9 w-9 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                      aria-label="Remove highlight"
                      title="Remove highlight"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Product Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => handleTypeChange(e.target.value as ProductType)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900"
                  disabled={loading}
                >
                  <option value="SIMPLE">Simple Product</option>
                  <option value="VARIABLE">Variable Product</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <select
                      value={parentCategoryId}
                      onChange={(e) => {
                        const nextParent = e.target.value;
                        setParentCategoryId(nextParent);
                        const nextSubs = categories.filter((c) => c.parentId === nextParent);
                        if (nextSubs.length > 0) {
                          setSubCategoryId("");
                          setField("categoryId", "");
                        } else {
                          setSubCategoryId("");
                          setField("categoryId", nextParent);
                        }
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900"
                      disabled={loading}
                    >
                      <option value="">Select parent</option>
                      {parentCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={subCategoryId}
                      onChange={(e) => {
                        const nextSub = e.target.value;
                        setSubCategoryId(nextSub);
                        setField("categoryId", nextSub);
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900 disabled:bg-zinc-50"
                      disabled={loading || !parentCategoryId || subCategories.length === 0}
                    >
                      <option value="">
                        {subCategories.length === 0 ? "No subcategories" : "Select subcategory"}
                      </option>
                      {subCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  Choose a parent category, then a subcategory (if available).
                </p>
              </div>
            </div>
          </div>

          <div className="rounded border border-zinc-200 p-6">
            <VariantFormSection
              variants={form.variants}
              productType={form.type}
              onAddVariant={addVariant}
              onRemoveVariant={removeVariant}
              onUpdateVariant={updateVariant}
              onAddAttribute={addAttribute}
              onUpdateAttribute={updateAttribute}
              onRemoveAttribute={removeAttribute}
              disabled={loading}
            />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded border border-zinc-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-800">Images</h2>
            <ImageUpload
              label="Main Image"
              value={form.mainImage}
              onChange={(file) => setField("mainImage", file)}
              required
              disabled={loading}
              disableRemove={typeof form.mainImage === "string"}
            />

            <div className="grid grid-cols-1 gap-4">
              <ImageUpload
                label="Gallery 1"
                value={form.gallery1}
                onChange={(file) => setField("gallery1", file)}
                disabled={loading}
              />
              <ImageUpload
                label="Gallery 2"
                value={form.gallery2}
                onChange={(file) => setField("gallery2", file)}
                disabled={loading}
              />
              <ImageUpload
                label="Gallery 3"
                value={form.gallery3}
                onChange={(file) => setField("gallery3", file)}
                disabled={loading}
              />
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
